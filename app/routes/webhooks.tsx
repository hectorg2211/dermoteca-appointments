import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getEvents, setEvent } from "../../utils/calendar";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } =
    await authenticate.webhook(request);

  if (!admin) {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    throw new Response();
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }

      break;
    case "PRODUCTS_UPDATE":
      console.log("⭐ A product has been updated");
      // await getEvents();
      break;
    case "ORDERS_PAID":
      console.log("⭐ A product has been purchased");
      // Identify if the paid items contains an appointment product
      const appointmentProduct = payload?.line_items?.find(
        (product: any) => product.properties.length > 0,
      );

      console.log(appointmentProduct);

      if (appointmentProduct) {
        await setEvent(appointmentProduct.properties, appointmentProduct.title);
      }
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
