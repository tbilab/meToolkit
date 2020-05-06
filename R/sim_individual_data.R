#' Generate sample individual level data based upon some phewas results
#'
#' This function will take the results of a phewas study (most importantly a
#' code, case and control numbers, and an OR) and simulate as many individual
#' datapoints as you desire.
#'
#' @param phewas_results Phewas results. Needs a column \code{code} with the id
#'   of a given phecode, \code{code_proportion}: with the proportion of
#'   individuals that have the code in the entire population, and \code{OR}: the
#'   odds ratio of having a code given having the snp of interest.
#' @param num_patients How many patients should be simulated.
#' @param snp_prev The overall population prevalence of the snp you want to
#'   simulate.
#'
#' @return list with following components \describe{ \item{snp_status}{tibble
#'   with patient \code{ID} and snp status (\code{snp})} \item{phenotypes}{wide
#'   tibble with an \code{ID} column and a column for each code provided in the
#'   \code{phewas_resuts} input. Cell values are if the patient had that given
#'   code.} }
#' @export
#'
#' @examples
#' sim_individual_data(fake_phewas_results, 10, 0.15)
sim_individual_data <- function(phewas_results, num_patients, snp_prev){
    # Get needed statistics out of the phewas results
    code_stats <- phewas_results %>%
      dplyr::mutate(
        # Force codes to be normalized
        code = meToolkit::normalize_phecodes(code),
        prob_wo_snp = code_proportion / (1 + snp_prev*(OR - 1)),
        prob_w_snp = OR*prob_wo_snp
      ) %>%
      dplyr::select(code, code_proportion, prob_w_snp, prob_wo_snp)

   # Function to setup an individual patients code list with
    # their snp status and id added to each code.
    setup_patient <- function(id){
      dplyr::mutate(code_stats,
                    id = paste0('r',id),
                    # Does this person have the mutation of interest?
                    has_snp = rbinom(n=1,size=1,p=snp_prev)
      )
    }

    # Simulate a tidy list of patient phenotypes and snp statuses
    patient_data_tidy <- 1:num_patients %>%
      purrr::map_df(setup_patient) %>%
      dplyr::mutate(
        # Decide code probabilities based upon snp status
        prob_of_codes = ifelse(has_snp, prob_w_snp, prob_wo_snp),
        # Draw bernouli for each code based upon patients prob
        value = rbinom(n=n(), size=1, p=prob_of_codes)
      ) %>%
      dplyr::select(id, has_snp, code, value)

    # Extract each patient's snp status from the tidy sim results
    patient_snp_status <- patient_data_tidy %>%
      dplyr::group_by(id) %>%
      dplyr::summarise(snp = dplyr::first(has_snp))

    # Make phenotype data wide
    patient_phenotypes <- patient_data_tidy %>%
      dplyr::select(-has_snp) %>%
      tidyr::spread(code, value)

    # Return list of results
    list(
      snp_status = patient_snp_status,
      phenotypes = patient_phenotypes
    )
}

