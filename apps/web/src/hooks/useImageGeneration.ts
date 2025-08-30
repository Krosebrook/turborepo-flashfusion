import { useState, useCallback, useRef } from 'react';
import { 
  ImageGenerationRequest, 
  ImageGenerationResponse, 
  ImageGenerationClient,
  GenerationStats,
  RateLimitInfo,
  APIError
} from '../types/imageGeneration';

interface UseImageGenerationState {
  isGenerating: boolean;
  progress: number;
  error: string | null;
  result: ImageGenerationResponse | null;
  stats: GenerationStats | null;
  rateLimit: RateLimitInfo | null;
}

interface UseImageGenerationOptions {
  baseUrl: string;
  authToken: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (result: ImageGenerationResponse) => void;
  onError?: (error: APIError) => void;
}

export function useImageGeneration(options: UseImageGenerationOptions) {
  const [state, setState] = useState<UseImageGenerationState>({
    isGenerating: false,
    progress: 0,
    error: null,
    result: null,
    stats: null,
    rateLimit: null,
  });

  const clientRef = useRef<ImageGenerationClient | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize client
  if (!clientRef.current && options.authToken) {
    clientRef.current = new ImageGenerationClient(options.baseUrl, options.authToken);
  }

  // Update client when auth token changes
  if (clientRef.current && options.authToken) {
    clientRef.current = new ImageGenerationClient(options.baseUrl, options.authToken);
  }

  const generateImage = useCallback(async (request: ImageGenerationRequest) => {
    if (!clientRef.current) {
      throw new Error('Client not initialized');
    }

    // Cancel any ongoing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isGenerating: true,
      progress: 0,
      error: null,
      result: null,
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 20, 90),
        }));
        
        if (options.onProgress) {
          options.onProgress(state.progress);
        }
      }, 1000);

      const result = await clientRef.current.generateImage(request);

      clearInterval(progressInterval);

      setState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 100,
        result,
      }));

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;

    } catch (error) {
      const apiError = error as APIError;
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 0,
        error: apiError.message,
      }));

      if (options.onError) {
        options.onError(apiError);
      }

      throw apiError;
    }
  }, [options, state.progress]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isGenerating: false,
      progress: 0,
      error: 'Generation cancelled',
    }));
  }, []);

  const fetchStats = useCallback(async () => {
    if (!clientRef.current) return null;

    try {
      const stats = await clientRef.current.getGenerationStats();
      setState(prev => ({ ...prev, stats }));
      return stats;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return null;
    }
  }, []);

  const fetchRateLimit = useCallback(async () => {
    if (!clientRef.current) return null;

    try {
      const rateLimit = await clientRef.current.getRateLimitInfo();
      setState(prev => ({ ...prev, rateLimit }));
      return rateLimit;
    } catch (error) {
      console.error('Failed to fetch rate limit:', error);
      return null;
    }
  }, []);

  const resetState = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      error: null,
      result: null,
      stats: null,
      rateLimit: null,
    });
  }, []);

  return {
    ...state,
    generateImage,
    cancelGeneration,
    fetchStats,
    fetchRateLimit,
    resetState,
  };
}

// Additional utility hook for form management
export function useImageGenerationForm() {
  const [formData, setFormData] = useState<ImageGenerationRequest>({
    positivePrompt: '',
    model: 'runware:100@1',
    width: 1024,
    height: 1024,
    numberResults: 1,
    negativePrompt: '',
    steps: 4,
    cfgScale: 1,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const updateField = useCallback(<K extends keyof ImageGenerationRequest>(
    field: K,
    value: ImageGenerationRequest[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [validationErrors]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string[]> = {};

    // Validate prompt
    if (!formData.positivePrompt?.trim()) {
      errors.positivePrompt = ['Prompt is required'];
    } else if (formData.positivePrompt.length > 1000) {
      errors.positivePrompt = ['Prompt cannot exceed 1000 characters'];
    }

    // Validate dimensions
    if (formData.width && (formData.width < 256 || formData.width > 2048)) {
      errors.width = ['Width must be between 256 and 2048 pixels'];
    }

    if (formData.height && (formData.height < 256 || formData.height > 2048)) {
      errors.height = ['Height must be between 256 and 2048 pixels'];
    }

    // Validate number of results
    if (formData.numberResults && (formData.numberResults < 1 || formData.numberResults > 4)) {
      errors.numberResults = ['Number of results must be between 1 and 4'];
    }

    // Validate steps
    if (formData.steps && (formData.steps < 1 || formData.steps > 50)) {
      errors.steps = ['Steps must be between 1 and 50'];
    }

    // Validate CFG scale
    if (formData.cfgScale && (formData.cfgScale < 0.1 || formData.cfgScale > 20)) {
      errors.cfgScale = ['CFG Scale must be between 0.1 and 20'];
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      positivePrompt: '',
      model: 'runware:100@1',
      width: 1024,
      height: 1024,
      numberResults: 1,
      negativePrompt: '',
      steps: 4,
      cfgScale: 1,
    });
    setValidationErrors({});
  }, []);

  return {
    formData,
    validationErrors,
    updateField,
    validateForm,
    resetForm,
    isValid: Object.keys(validationErrors).length === 0,
  };
}