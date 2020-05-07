#' Simulate PheWAS results
#'
#' Produces a dataframe that can be used for testing out
#' functions in package on simulated data. Usually paired with
#' \code{meToolkit::sim_individual_data()}. Note that the results from this are
#' a very rough simulation and should not be used for any legitimate simulation
#' studies.
#'
#'
#' @param n_codes How many phecodes should be simulated for the results?
#' @param n_categories How many categories should the phecodes be grouped into?
#'   Can't be more than 26.
#' @param avg_OR The rough average of the odds ratio for the each code.
#'
#' @return A dataframe with columns: \code{code}: a unique phecode id (numbers
#'   of the form x.00), \code{p_val}: P-value drawn from a beta distribution
#'   peaked near zero, \code{OR}: An odds ratio for the code's test results,
#'   \code{category}: A simulated category (just a letter currently) that fills
#'   in order with last group category having less codes in it if there is not
#'   an even division of codes to categories. \code{tooltip}: Simple two line
#'   html tooltip of the code name and simulated p-value.
#'
#' @examples
#' sim_phewas_results(n_codes = 100, n_categories = 11)
 #' @export
sim_phewas_results <- function(n_codes, n_categories, avg_OR = 1.3) {
  # Parameters used in generating p-values from a beta distribution.
  # Odds ratio is just a randomly permutted version of the log of the p-value
  alpha <- 1
  beta <- 8

  if (n_codes < n_categories) {
    stop("You can't have more categories than you do codes.")
  }

  if (n_categories > 26) {
    stop("Currently meToolkit doesn't support more than 26 categories.")
  }
  codes_per_cat <- ceiling(n_codes / n_categories)

  dplyr::tibble(
    code = sprintf('%2.2f', 1:n_codes),
    p_val = rbeta(n_codes, alpha, beta),
    category = rep(head(letters, n_categories),
                   each = codes_per_cat) %>% head(n_codes),
    OR = -log(p_val) * avg_OR * runif(n_codes, min = 0.5, max = 2),
    tooltip = glue::glue(
      '<strong> Code: </strong> {code}</br><strong>P-Value: </strong> {formatC(p_val, format = "e", digits = 2)}'
    )
  )
}
