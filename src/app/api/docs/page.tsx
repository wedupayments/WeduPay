import { Metadata } from "next";
import { DocsContent } from "./DocsContent";

export const metadata: Metadata = {
  title: "API Documentation | WeduPay",
  description: "WeduPay REST API Reference",
  robots: "noindex, nofollow",
};

export default function ApiDocsPage() {
  return <DocsContent />;
}
