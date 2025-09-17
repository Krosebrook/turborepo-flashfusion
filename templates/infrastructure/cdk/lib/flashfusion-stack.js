import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class FlashFusionStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environment = this.node.tryGetContext('environment') || 'dev';

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'FlashFusionVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // Security Group for web tier
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc,
      description: 'Security group for web tier',
      allowAllOutbound: true
    });

    // Allow HTTP and HTTPS traffic
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // S3 bucket for application assets
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `flashfusion-${environment}-assets-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
    });

    // S3 bucket for logs
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `flashfusion-${environment}-logs-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(60)
            }
          ]
        }
      ],
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
    });

    // IAM role for application instances
    const appRole = new iam.Role(this, 'ApplicationRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for FlashFusion application instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy')
      ]
    });

    // Grant read access to assets bucket
    assetsBucket.grantRead(appRole);
    
    // Grant write access to logs bucket
    logsBucket.grantWrite(appRole);

    // Output important values
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `FlashFusion-${environment}-VpcId`
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `FlashFusion-${environment}-PublicSubnetIds`
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `FlashFusion-${environment}-PrivateSubnetIds`
    });

    new cdk.CfnOutput(this, 'WebSecurityGroupId', {
      value: webSecurityGroup.securityGroupId,
      description: 'Web Security Group ID',
      exportName: `FlashFusion-${environment}-WebSecurityGroupId`
    });

    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: assetsBucket.bucketName,
      description: 'Assets S3 Bucket Name',
      exportName: `FlashFusion-${environment}-AssetsBucketName`
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'Logs S3 Bucket Name',
      exportName: `FlashFusion-${environment}-LogsBucketName`
    });
  }
}