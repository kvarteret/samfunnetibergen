export const sourceLinkProjection = `{
    _key,
    label,
    linkType,
    "href": select(
        linkType == "internalPage" && internalPage->_type == "homePage" => "/",
        linkType == "internalPage" && internalPage->_type == "eventsPage" => "/arrangementer",
        linkType == "internalPage" && internalPage->_type == "roomsPage" => "/rom",
        linkType == "internalPage" && internalPage->_type == "groupsPage" => "/grupper",
        linkType == "internalPage" && internalPage->_type == "sponsorsPage" => "/sponsorer",
        linkType == "internalPage" && internalPage->_type == "kontaktPage" => "/kontakt",
        linkType == "internalPage" && internalPage->_type == "page" && defined(internalPage->slug.current) => "/" + internalPage->slug.current,
        linkType == "internalPage" && internalPage->_type == "arrangement" && defined(internalPage->slug.current) => "/arrangementer/" + internalPage->slug.current,
        linkType == "internalPage" && internalPage->_type == "room" && defined(internalPage->slug.current) => "/rom/" + internalPage->slug.current,
        linkType == "internalPage" && internalPage->_type == "studentGroup" && defined(internalPage->slug.current) => "/grupper/" + internalPage->slug.current,
        linkType == "internalPath" => internalPath,
        linkType == "external" => externalUrl
    )
}`;
