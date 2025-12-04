import { jsonp } from '@/utils/jsonp'

export async function getSuggestions(query: string, engineId: string = 'google'): Promise<string[]> {
    if (!query.trim()) return []

    try {
        let response: any

        switch (engineId) {
            case 'baidu':
                // Baidu: window.baidu.sug({q:..., s:[...]})
                response = await jsonp<any>('https://suggestion.baidu.com/su', {
                    wd: query,
                }, 'cb')
                if (response && Array.isArray(response.s)) {
                    return response.s
                }
                break

            case 'bing':
                // Bing: Standard OpenSearch JSON [query, [suggestions], ...]
                response = await jsonp<any>('https://api.bing.com/osjson.aspx', {
                    query: query,
                    JsonType: 'callback',
                }, 'JsonCallback')
                if (Array.isArray(response) && response.length >= 2 && Array.isArray(response[1])) {
                    return response[1]
                }
                break

            case 'duckduckgo':
                // DuckDuckGo: [{phrase: "..."}]
                response = await jsonp<any>('https://duckduckgo.com/ac/', {
                    q: query,
                    type: 'list'
                })
                if (Array.isArray(response)) {
                    return response.map((item: any) => item.phrase)
                }
                break

            case 'youtube':
                response = await jsonp<any>('https://suggestqueries.google.com/complete/search', {
                    client: 'youtube',
                    ds: 'yt',
                    q: query,
                    hl: 'zh-CN',
                })
                if (Array.isArray(response) && response.length >= 2 && Array.isArray(response[1])) {
                    return response[1]
                }
                break

            case 'google':
            default:
                // Google
                response = await jsonp<any>('https://www.google.com/complete/search', {
                    client: 'firefox',
                    q: query,
                    hl: 'zh-CN',
                })
                if (Array.isArray(response) && response.length >= 2 && Array.isArray(response[1])) {
                    return response[1]
                }
                break
        }

        return []
    } catch (e) {
        console.error(`Failed to fetch suggestions for ${engineId}`, e)
        return []
    }
}
