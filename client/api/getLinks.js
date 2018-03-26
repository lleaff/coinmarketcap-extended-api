const getLinks = ($) => {
  try {
    const linksRows = $('div.row.bottom-margin-2x > div.col-sm-4.col-sm-pull-8:last-child > ul')
      .children().get()
    const rawLinksHtml = linksRows.map(r => $(r).find('a'))
      // Remove rows without a tag
      .filter(a => a.get()[0])
    const links = rawLinksHtml.map(a => ({
      label: a.text().trim(),
      url: a.attr('href'),
    }))
    return links
  } catch(e) {
    console.error('[getLinks]: ', e)
  }
}

export default getLinks
