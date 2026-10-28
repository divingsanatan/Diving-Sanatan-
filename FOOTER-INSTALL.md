# Footer install

1. Files go in `src/components/` (already laid out in this zip).
2. In `src/app/layout.tsx`:

   import Footer from "@/components/Footer";   // or "../components/Footer"
   ...
   <body>
     {children}
     <Footer />
   </body>

3. Edit the `groups` array at the top of `Footer.tsx` (routes and YouTube/Instagram handles are placeholders).
4. Optional: load "Tiro Devanagari Hindi" with next/font/google and set its CSS variable to `--font-footer-display`.
