export interface ProductContent {
  metric?: string;
  label?: string;
  tag?: string;
  colorClass?: string;
  [key: string]: any;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  lender: string;
  imageUrl?: string;
  status: string;
  isPanIndia: boolean;
  content?: ProductContent;
  ineligible_reason?: any;
}

export interface BaseResponse<T> {
  status: "Success" | "Error" | "Failed";
  message: string;
  response: T;
}

export interface GetProductsRequest {
  channel?: "AGENT" | "CUSTOMER" | "LANDING";
}

export type GetProductsResponse = BaseResponse<Product[]>;

export interface CheckEligibilityRequest {
  pincode: string;
}

export interface EligibilityData {
  pincode: string;
  resolved_state: string | null;
  eligible_products: Product[];
  ineligible_products: Product[];
  total_eligible: number;
  total_ineligible: number;
}

export type CheckEligibilityResponse = BaseResponse<EligibilityData>;
