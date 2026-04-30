import {
  extend,
  render,
  useExtensionInput,
  BlockStack,
  Button,
  CalloutBanner,
  Heading,
  Image,
  Text,
  TextContainer,
  TextBlock,
  Layout,
  View,
} from "@shopify/post-purchase-ui-extensions-react";

// The backend URL — our Next.js app
const BACKEND_URL = "https://nitaiecompro-nine.vercel.app";

interface OfferConfig {
  product_title: string;
  product_image_url: string;
  headline: string;
  subheadline: string;
  cta_text: string;
  decline_text: string;
  price: number;
  original_price?: number;
  product_variant_id: string;
  funnel_id: string;
}

extend("Checkout::PostPurchase::ShouldRender", async ({ inputData, storage }) => {
  // Ask our backend if there's an active offer for this order
  try {
    const res = await fetch(`${BACKEND_URL}/api/pp-funnels/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: inputData.initialPurchase.referenceId,
        order_total: inputData.initialPurchase.totalPriceSet.presentmentMoney.amount,
        line_items: inputData.initialPurchase.lineItems.map((li: any) => ({
          product_id: li.product.id,
          variant_id: li.variant?.id,
          quantity: li.quantity,
        })),
        shop: inputData.shop.domain,
        customer_email: inputData.customer?.email,
      }),
    });

    if (!res.ok) return { render: false };
    const offer: OfferConfig = await res.json();
    if (!offer || !offer.product_variant_id) return { render: false };

    // Store the offer config for the render step
    await storage.update(offer);
    return { render: true };
  } catch {
    return { render: false };
  }
});

render("Checkout::PostPurchase::Render", () => <PostPurchaseOffer />);

function PostPurchaseOffer() {
  const { storage, inputData, calculateChangeset, applyChangeset, done } = useExtensionInput<OfferConfig>();
  const offer = storage.initialData as OfferConfig;

  const handleAccept = async () => {
    const { errors, calculateChangesetToken } = await calculateChangeset({
      changes: [
        {
          type: "add_variant",
          variantId: offer.product_variant_id,
          quantity: 1,
        },
      ],
    });

    if (errors?.length) { done(); return; }

    // Record accept in our backend
    await fetch(`${BACKEND_URL}/api/pp-funnels/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: inputData.initialPurchase.referenceId,
        funnel_id: offer.funnel_id,
        shop: inputData.shop.domain,
      }),
    });

    await applyChangeset(calculateChangesetToken);
    done();
  };

  const handleDecline = async () => {
    await fetch(`${BACKEND_URL}/api/pp-funnels/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: inputData.initialPurchase.referenceId,
        funnel_id: offer.funnel_id,
        shop: inputData.shop.domain,
      }),
    });
    done();
  };

  return (
    <BlockStack spacing="loose">
      <CalloutBanner title={offer.headline}>
        <TextBlock>{offer.subheadline}</TextBlock>
      </CalloutBanner>

      {offer.product_image_url && (
        <Image source={offer.product_image_url} description={offer.product_title} />
      )}

      <TextContainer>
        <Heading>{offer.product_title}</Heading>
        <Text size="medium" emphasized>
          ${offer.price.toFixed(2)}
          {offer.original_price && (
            <Text subdued> (was ${offer.original_price.toFixed(2)})</Text>
          )}
        </Text>
      </TextContainer>

      <Layout
        media={[
          { viewportSize: "small", sizes: [1, 0, 1], maxInlineSize: 0.9 },
          { viewportSize: "medium", sizes: [532, 0, 1], maxInlineSize: 420 },
          { viewportSize: "large", sizes: [560, 38, 340] },
        ]}
      >
        <Button onPress={handleAccept} submit>
          {offer.cta_text || "Add to my order"}
        </Button>
        <View />
        <Button onPress={handleDecline} subdued>
          {offer.decline_text || "No thanks"}
        </Button>
      </Layout>
    </BlockStack>
  );
}
