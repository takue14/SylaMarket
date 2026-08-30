import { Product } from '@/types/product';

export type PostLoginIntentType = 'add-to-cart' | 'buy-now';

export interface PostLoginIntent {
  type: PostLoginIntentType;
  productId: string;
}

const KEY = 'postLoginIntent';

export function setPostLoginIntent(intent: PostLoginIntent) {
  sessionStorage.setItem(KEY, JSON.stringify(intent));
}

export function getPostLoginIntent(): PostLoginIntent | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PostLoginIntent;
  } catch {
    return null;
  }
}

export function clearPostLoginIntent() {
  sessionStorage.removeItem(KEY);
}

/**
 * Call this right after a buyer successfully logs in. Fetches the exact
 * product they were trying to act on before being sent to sign up, and
 * replays that action (add to cart, or add + go straight to checkout).
 * Returns the resolved intent so the caller can decide where to redirect
 * next, or null if there was nothing to resume.
 */
export async function resolvePostLoginIntent(
  addToCart: (product: Product) => boolean,
  buyNow: (product: Product) => boolean
): Promise<PostLoginIntent | null> {
  const intent = getPostLoginIntent();
  if (!intent) return null;
  clearPostLoginIntent();

  try {
    const res = await fetch(`/api/products/${intent.productId}`);
    if (!res.ok) return null; // product may have been deleted/unlisted since they clicked it
    const product: Product = await res.json();

    if (intent.type === 'buy-now') {
      buyNow(product);
    } else {
      addToCart(product);
    }
    return intent;
  } catch {
    return null;
  }
}