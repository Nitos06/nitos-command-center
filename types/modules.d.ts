declare module "mjml" {
  interface MjmlResult {
    html: string;
    errors: Array<{ line: number; message: string; tagName: string }>;
  }
  interface MjmlOptions {
    validationLevel?: "strict" | "soft" | "skip";
    filePath?: string;
    minify?: boolean;
  }
  function mjml(input: string, options?: MjmlOptions): MjmlResult;
  export default mjml;
}
