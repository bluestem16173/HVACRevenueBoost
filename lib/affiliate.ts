const AMAZON_TAG = "decisiongrid2-20";

export function buildAmazonLink(asin: string) {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
}
