export interface UserAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string | null;
  country: string;
}

export function formatAddressLine(address: UserAddress) {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  return parts.join(", ");
}
