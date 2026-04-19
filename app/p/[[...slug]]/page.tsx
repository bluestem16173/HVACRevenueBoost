import { getPageFromDB } from "@/src/lib/pages/getPageFromDbBySlug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = { params: { slug?: string[] } };

export default async function Page({ params }: PageProps) {
  const slug = params.slug?.length ? params.slug.join("/") : "";

  if (!slug) {
    return (
      <div style={{ padding: 20 }}>
        <p>
          Append a storage slug, e.g. <code>/p/hvac/ac-not-cooling/tampa-fl</code>
        </p>
      </div>
    );
  }

  try {
    let page = await getPageFromDB(slug);
    if (!page && !slug.toLowerCase().endsWith("/tampa-fl")) {
      page = await getPageFromDB(`${slug}/tampa-fl`);
    }

    if (!page) {
      return <div style={{ padding: 20 }}>Page not found</div>;
    }

    if (page.content_html) {
      return <div dangerouslySetInnerHTML={{ __html: page.content_html }} />;
    }

    if (page.content_json != null) {
      const raw =
        typeof page.content_json === "string"
          ? page.content_json
          : JSON.stringify(page.content_json, null, 2);
      return (
        <div style={{ padding: 20 }}>
          <h1>{page.title ?? page.slug}</h1>
          <pre>{raw}</pre>
        </div>
      );
    }

    return <div>No content available</div>;
  } catch (err) {
    console.error("PAGE ERROR:", slug, err);

    return (
      <div style={{ padding: 20 }}>
        <h1>Loading...</h1>
        <p>This page is being prepared.</p>
      </div>
    );
  }
}
