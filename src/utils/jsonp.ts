/**
 * A simple JSONP implementation
 * @param url The URL to fetch
 * @param params Query parameters
 * @param callbackName The name of the callback parameter (default: 'callback')
 */
export function jsonp<T>(url: string, params: Record<string, any> = {}, callbackName = 'callback'): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = `jsonp_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    const script = document.createElement('script')
    
    // Create the global callback function
    ;(window as any)[id] = (data: T) => {
      cleanup()
      resolve(data)
    }

    // Handle errors
    script.onerror = () => {
      cleanup()
      reject(new Error(`JSONP request to ${url} failed`))
    }

    // Construct URL
    const query = new URLSearchParams(params)
    query.set(callbackName, id)
    script.src = `${url}${url.includes('?') ? '&' : '?'}${query.toString()}`

    // Cleanup function
    function cleanup() {
      if (script.parentNode) script.parentNode.removeChild(script)
      delete (window as any)[id]
    }

    document.head.appendChild(script)
  })
}
