/// <reference types="react-scripts" />

// Declare module for JSON files to support dynamic imports
declare module "*.json" {
  const value: any;
  export default value;
}
