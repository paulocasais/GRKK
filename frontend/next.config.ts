import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   If you need a fully static export set `output: "export"`.
   During development we prefer the default dynamic behaviour so that
   dynamic routes (like /exames/[id]) don't require exhaustive
   generateStaticParams() declarations. Remove or enable the line
   below only when you intentionally want a static export.
  */
  output: "export",
};

export default nextConfig;
