#' Generate sample indivual level data
#' This function is a helper for prototyping functions. Generates a dataframe of individual-level data for use in other functions.
#' Note that there is a guarentee that each case will have at least one code, but there is not a guarentee that each code will have a case.
#'
#' @param n_codes How many phecodes needed
#' @param n_cases How many cases are needed
#' @param prob_snp What's the probability of a copy of a minor allele? A bernouli probability with two trials.
#'
#' @return A dataframe with rows corresponding to each case or patient and columns corresponding to phecode.
#' In addition, a column \code{IID} for a case id string and \code{snp} corresponding to number of copies of the minor allele are included in output.
#' @export
#'
#' @examples
simIndividualData <- function(n_codes, n_cases, prob_snp){

  code_names <- sprintf('%2.2f', 1:n_codes)

  gen_case_row <- function(case_name){
    case_n_codes <- sample(1:n_codes, size = 1)
    case_code_vec <- sample(rep(c(1,0), times = c(case_n_codes, n_codes - case_n_codes)), size = n_codes)

    case_code_vec %>%
      t() %>%
      magrittr::set_colnames(code_names) %>%
      tibble::as_tibble() %>%
      dplyr::mutate(
        IID = case_name,
        snp = rbinom(1,2, prob = prob_snp)
      )
  }

  paste0('case_', 1:n_cases) %>%
    purrr::map_df(gen_case_row)
}

