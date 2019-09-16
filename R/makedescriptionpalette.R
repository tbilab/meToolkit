#' Create Description Color Palette
#'
#' Make a standardized color pallete for the phenotype categories
#'
#' @param phecode_info Dataframe of phecodes included in the current view of the
#'   application. Must include the column `category`.
#' @param color_palette Character vector of hex codes to be mapped to the
#'   descriptions in first come first filled order.
#'
#' @return A list containing a palette dataframe and a named array both
#'   containing mappings from description character string to hex code.
#' @export
#'
#' @examples
#' makeDescriptionPalette(myCurrentPhecodes)
makeDescriptionPalette <- function(
  phecode_info,
  color_palette = c(
    "#895de6",
    "#6ecc3b",
    "#e34bca",
    "#9ad843",
    "#ff3d97",
    "#01d8a6",
    "#ff4254",
    "#64c5ff",
    "#957100",
    "#0074d3",
    "#aad366",
    "#ff8dcc",
    "#4e5b00",
    "#ffb38f",
    "#325c2c",
    "#faba5f",
    "#8b373b",
    "#7e431e" )
){

  unique_descriptions <- unique(phecode_info$category)

  palette <- tibble::tibble(
    description = unique_descriptions,
    color = color_palette %>% head(length(unique_descriptions))
  )

  # turn dataframe into a named array for ggplot scale
  palette_array <- palette$color
  names(palette_array) <- palette$description

  list(
    palette = palette,
    named_array = palette_array
  )
}
