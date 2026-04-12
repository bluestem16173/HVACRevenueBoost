import type { FastifyInstance } from "fastify";
import { getPublishedPageBySlug } from "../lib/pages/getPublishedPageBySlug.js";
import { mapResidentialAuthorityJsonToViewModel } from "../lib/renderers/renderResidentialAuthorityPage.js";

export async function publicPagesRoutes(app: FastifyInstance) {
  app.get("/*", async (request, reply) => {
    const rawPath = String(request.raw.url || "/").split("?")[0];
    const slug = rawPath.replace(/^\/+/, "");

    const page = await getPublishedPageBySlug(slug);
    if (!page) {
      return reply.callNotFound();
    }

    const pageType = page.page_type || "";

    // Force Fastify/EJS delivery for authority/city pages
    if (pageType === "dg_authority_v2" || pageType === "hvac_authority_v3" || slug.startsWith("hvac/") || slug.startsWith("rv/hvac/")) {
      const parsed =
        typeof page.content_json === "string"
          ? JSON.parse(page.content_json)
          : page.content_json;

      const vm = mapResidentialAuthorityJsonToViewModel(parsed || {});

      return reply.view("layouts/authority-guide.html", {
        title: vm.title,
        subtitle: vm.subtitle,
        // Point to the partial we created earlier which uses the 'content' key
        contentPartial: "partials/residential-authority-body.ejs",
        content: vm, 
        seo: {
          title: vm.title,
          description: vm.subtitle,
        },
        serviceCtaType: 'hvac', // Hardcoded context for HVAc residential
        showRvServiceCta: false 
      });
    }

    return reply.callNotFound();
  });
}
