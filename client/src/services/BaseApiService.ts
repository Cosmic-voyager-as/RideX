/** OOP: Abstraction, Inheritance & Encapsulation
 *  WHY: BaseApiService acts as an abstract contract and template for HTTP communication,
 *  encapsulating authorization tokens, error parsing, and JSON headers from consumer services. */
export abstract class BaseApiService {
  // ENCAPSULATION: Base URL is protected, accessible only to subclasses
  protected readonly baseUrl: string;

  constructor(baseUrl: string = '/api') {
    // ABSTRACTION: Prevent direct instantiation of abstract service at runtime
    if (new.target === BaseApiService) {
      throw new Error('Cannot instantiate abstract class BaseApiService directly');
    }
    this.baseUrl = baseUrl;
  }

  // ENCAPSULATION: Token retrieval is protected
  protected getAuthToken(): string | null {
    return localStorage.getItem('ridex_token');
  }

  // ENCAPSULATION: Centralized HTTP request execution with automatic token injection
  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    // Safely parse JSON or text body to avoid 'Unexpected end of JSON input' on empty / non-JSON responses
    const rawText = await response.text();
    let data: any = null;
    if (rawText && rawText.trim().length > 0) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { message: rawText };
      }
    }

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        (typeof data?.error === 'object' && data?.error?.message) ||
        (typeof data?.error === 'string' && data?.error) ||
        `HTTP Request failed with status ${response.status} (${response.statusText || 'Error'})`;
      throw new Error(errorMsg);
    }

    if (!data) {
      return {} as T;
    }

    return data.data !== undefined ? data.data : data;
  }
}

