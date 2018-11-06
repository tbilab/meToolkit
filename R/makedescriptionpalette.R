# Make a standardized color pallete for the phenotype categories
#' Create Description Color Palette
#'
#' @param phecode_info Dataframe of phecodes included in the current view of the application
#'
#' @return A list containing a palette dataframe and a named array both containing mappings from description character string to hex code.
#' @export
#'
#' @examples
makeDescriptionPalette <- function(phecode_info){

  unique_descriptions <- phecode_info$category %>% unique()


  palette <- data_frame(
    description = unique_descriptions,
    color = CATEGORY_COLORS %>% head(length(unique_descriptions))
  )

  palette_array <- palette$color # turn dataframe into a named array for ggplot scale
  names(palette_array) <- palette$description

  list(
    palette = palette,
    named_array = palette_array
  )
}
