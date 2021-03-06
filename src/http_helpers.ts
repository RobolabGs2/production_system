export function fetchJSON(url: RequestInfo): Promise<any> {
    return fetch(url,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => response.json())
}

export function fetchTxt(url: RequestInfo): Promise<string> {
    return fetch(url,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'text/plain'
            }
        }).then(response => response.text())
}

export function fetchImage(name: string): Promise<ImageBitmapSource>
{
    return new Promise(function(resolve, reject)
    {
        let img = new Image();
        img.onload = function()
        {
            return resolve(img);
        };
        img.onerror = function()
        {
            return reject(name);
        };
        img.src = `/resources/images/${name}`;
    });
}