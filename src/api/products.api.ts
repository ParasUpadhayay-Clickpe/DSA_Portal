import { BaseApi } from "./base.api";
import { LOS_API_BASE_URL } from "@/config";
import type {
  GetProductsRequest,
  GetProductsResponse,
  CheckEligibilityRequest,
  CheckEligibilityResponse,
} from "@/types/products.types";

export class ProductsApi extends BaseApi {
  constructor() {
    super(LOS_API_BASE_URL);
  }

  async getProducts(
    request: GetProductsRequest = {}
  ): Promise<GetProductsResponse> {
    try {
      const queryParams = request.channel ? `?channel=${request.channel}` : "";

      const response = await this.get<GetProductsResponse>(
        `/products${queryParams}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return {
        status: "Error",
        message: response.message || "Failed to fetch products",
        response: [],
      };
    } catch (error) {
      const apiError = this.handleError(error);
      return {
        status: "Error",
        message:
          apiError.message || "Failed to fetch products. Please try again.",
        response: [],
      };
    }
  }

  async checkEligibility(
    request: CheckEligibilityRequest
  ): Promise<CheckEligibilityResponse> {
    try {
      const response = await this.post<CheckEligibilityResponse>(
        "/products/eligibility",
        request,
        true
      );

      if (response.success && response.data) {
        return response.data;
      }

      return {
        status: "Error",
        message: response.message || "Failed to check eligibility",
        response: {
          pincode: request.pincode,
          resolved_state: null,
          eligible_products: [],
          ineligible_products: [],
          total_eligible: 0,
          total_ineligible: 0,
        },
      };
    } catch (error) {
      const apiError = this.handleError(error);
      return {
        status: "Error",
        message:
          apiError.message || "Failed to check eligibility. Please try again.",
        response: {
          pincode: request.pincode,
          resolved_state: null,
          eligible_products: [],
          ineligible_products: [],
          total_eligible: 0,
          total_ineligible: 0,
        },
      };
    }
  }
}

export const productsApi = new ProductsApi();
