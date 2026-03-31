declare module "swagger-ui-react" {
  import { ComponentType, ReactNode } from "react";

  interface SwaggerUIProps {
    url?: string;
    spec?: object;
    specFile?: string;
    configuration?: object;
    props?: object;
    wrapperProps?: object;
    FallbackComponent?: ComponentType;
    LoadingFallback?: ComponentType;
    requestInterceptor?: (request: object) => object;
    responseInterceptor?: (response: object) => object;
    children?: ReactNode;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}

declare module "swagger-ui-react/swagger-ui.css";
