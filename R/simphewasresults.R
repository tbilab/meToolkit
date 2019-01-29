#' Simulate PheWAS results
#' Produces a dataframe that can be used for testing out functions in package on simulated data. Usually paired with \code{meToolkit::simIndividualData()}.
#'
#' @param n_codes How many phecodes should be simulated for the results?
#' @param n_categories How many categories should the phecodes be grouped into? Can't be more than 26.
#'
#' @return A dataframe with columns: \code{code}: a unique phecode id (numbers of the form x.00), \code{p_val}: P-value drawn from a beta distribution peaked near zero,
#' \code{category}: A simulated category (just a letter currently) that fills in order with last group category having less codes in it if there is not an even division of codes to categories.
#' \code{tooltip}: Simple two line html tooltip of the code name and simulated p-value.
#' @export
#'
#' @examples
simPhewasResults <- function(n_codes, n_categories){

  # Parameters used in generating p-values from a beta distribution.
  alpha <- 1
  beta <- 8

  if(n_codes < n_categories){
    stop("You can't have more categories than you do codes.")
  }

  if(n_categories > 26){
    stop("Currently meToolkit doesn't support more than 26 categories.")
  }

  codes_per_cat <- ceiling(n_codes/n_categories)

  tibble::tibble(
    code = sprintf('%2.2f', 1:n_codes),
    p_val = rbeta(n_codes, alpha, beta),
    category = rep(
      head(letters, n_categories),
      each = codes_per_cat
    ) %>% head(n_codes)
  ) %>%
    dplyr::mutate(
      tooltip = glue::glue('<strong> Code: </strong> {code}</br><strong>P-Value: </strong> {formatC(p_val, format = "e", digits = 2)}')
    )
}
