import { assertDgAuthorityV2StructuredPayload } from "@/lib/dg/validateDgAuthorityV2Structured";
import { assertDgAuthorityV3StructuredPayload } from "@/lib/dg/validateDgAuthorityV3Structured";
import { isStructuredDgAuthorityV3Payload } from "@/lib/dg/validateDgAuthorityV3Structured";
import { RenderDGAuthority } from "@/components/dg/RenderDGAuthority";
import { RenderDgAuthorityV3 } from "@/components/dg/RenderDgAuthorityV3";

const verticalBadge: Record<string, string> = {
  hvac: "dg-structured-preview__badge dg-structured-preview__badge--hvac",
  plumbing: "dg-structured-preview__badge dg-structured-preview__badge--plumbing",
  electrical: "dg-structured-preview__badge dg-structured-preview__badge--electrical",
};

/**
 * Structured DG preview: **v3** (dual-layer pro/home/risk + CTAs) or **v2** fallback.
 * Layout order is locked in {@link RenderDgAuthorityV3} / {@link RenderDGAuthority}.
 */
export function DgStructuredAuthorityArticle({
  data,
  vertical,
}: {
  data: Record<string, unknown>;
  vertical: "hvac" | "plumbing" | "electrical";
}) {
  if (isStructuredDgAuthorityV3Payload(data)) {
    assertDgAuthorityV3StructuredPayload(data);
  } else {
    assertDgAuthorityV2StructuredPayload(data);
  }

  const badgeClass = verticalBadge[vertical] ?? "dg-structured-preview__badge";

  return (
    <article className="dg-structured-preview mx-auto max-w-4xl px-4 py-12">
      <p className={`mb-4 ${badgeClass}`}>
        {vertical} · DG structured preview
      </p>
      {isStructuredDgAuthorityV3Payload(data) ? (
        <RenderDgAuthorityV3 data={data} trade={vertical} />
      ) : (
        <RenderDGAuthority data={data} />
      )}
    </article>
  );
}
