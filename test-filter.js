const allowedDomains = [];
const items = [
  {
    widget: {
      type: 'webpage',
      dataPayload: JSON.stringify({ url: 'https://fids.tropicair.com' })
    }
  }
];

const mappedItems = items.map((item) => {
  if (item.widget) {
    let dataPayload = item.widget.dataPayload ? JSON.parse(item.widget.dataPayload) : null;
    if (item.widget.type === 'embed' || item.widget.type === 'canva' || item.widget.type === 'webpage') {
       if (dataPayload?.url) {
          try {
            const url = dataPayload.url.startsWith('http') ? dataPayload.url : `https://${dataPayload.url}`;
            const hostname = new URL(url).hostname.toLowerCase();
            const isAllowed = allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
            console.log({hostname, allowedDomains, isAllowed});
            if (!isAllowed) return null; // Strip the whole widget if unallowed
          } catch(e) { return null; }
       }
    }
    return {
      id: item.widget.id,
      type: 'widget',
      widgetType: item.widget.type,
      dataPayload
    };
  }
}).filter(Boolean);

console.log(mappedItems);
