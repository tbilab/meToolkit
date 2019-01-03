#' Build Color Palette
#' Takes a dataframe and a column to build a color palette for and returns the dataframe with a \code{color} column added with a unique color for each category.
#'
#' @param df Dataframe of rows to be colored.
#' @param indexCol Unquoted name of column to be used for deciding each row's color.
#'
#' @return \code{df} with an added \code{color} column.
#' @export
#'
#' @examples
#' df %>% buildColorPalette(Category)
buildColorPalette <- function(df, indexCol){

  indexCol_quo <- rlang::enquo(indexCol)

  # Exported from http://tools.medialab.sciences-po.fr/iwanthue/
  available_colors <- c(
    "#d54c3b","#73d54a","#7245ce","#cad149","#ce4ec8","#76d58b",
    "#562d7b","#d4983d","#857ccb","#59803d","#cb4c86","#77cdc0",
    "#792f39","#ccc795","#3c2a46","#97b7dc","#98653a","#5a7684",
    "#d395a5","#3a412b")

  # By sorting here we ensure the same colors will always map to the same
  # index/categories even if the dataframe is in a different order/has different
  # numbers of rows. As long as the same unique categories exist.
  unique_values <- df %>% dplyr::pull(!!indexCol_quo) %>% unique() %>% sort()

  if(length(unique_values) > length(available_colors)) {
    stop('Currently only supports up to 20 unique categories. Consider using a sparser category delimeter.')
  }

  dplyr::right_join(
    df,
    tibble::tibble(
      !!rlang::quo_name(indexCol_quo) := unique_values,
      color = head(available_colors, length(unique_values))
    ),
    by = rlang::quo_name(indexCol_quo))
}
