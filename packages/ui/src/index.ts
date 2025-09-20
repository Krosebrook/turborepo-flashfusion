// FlashFusion UI Component Library
// Export placeholder components until actual components are implemented

export const Button = ({ children, ...props }: any) => {
  return <button {...props}>{children}</button>;
};

export const Card = ({ children, ...props }: any) => {
  return <div {...props}>{children}</div>;
};

export const Input = ({ ...props }: any) => {
  return <input {...props} />;
};

// Export all components
export default {
  Button,
  Card,
  Input,
};