import axios from "axios";

export const buildDeliveryQuery = (address = {}) => {
  return [
    address.street,
    address.zipcode,
    "Coimbatore",
    "Tamil Nadu",
    "India",
  ]
    .filter(Boolean)
    .join(", ");
};

export const geocodeAddress = async ({ url, token, address }) => {
  const query = buildDeliveryQuery(address);

  if (!query) {
    return null;
  }

  const response = await axios.post(
    `${url}/api/order/geocode`,
    address,
    { headers: { token } }
  );

  if (!response.data?.success) {
    return null;
  }

  return response.data.data;
};

export const reverseGeocodeLocation = async ({ url, token, lat, lng }) => {
  const response = await axios.post(
    `${url}/api/order/reverse-geocode`,
    { lat, lng },
    { headers: { token } }
  );

  if (!response.data?.success) {
    return null;
  }

  return response.data.data;
};
