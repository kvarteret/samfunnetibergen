export const portableTextProjection = `{
    _key,
    _type,
    ...,
    markDefs[] {
        ...,
        _type == "link" => {
            ...,
            "target": coalesce(target, select(blank == true => "blank", "self"))
        }
    },
    _type == "image" => {
        "imageUrl": asset->url,
        alt,
        caption
    }
}`;
