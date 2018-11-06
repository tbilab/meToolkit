#' Subset phenotype data to a given list of phecodes
#'    Removes individuals who have none of the requested codes
#'
#' @param data A wide phenotype file with columns IID, snp, and all the normalized phecode names
#' @param desiredCodes Character vector of the phecodes to be extracted
#' @param codes_to_invert Character vector of phecodes that the user has requested be inverted (e.g. not having the code is considered 'having' it.)
#'
#' @return A wide dataframe with just the columns desired and only rows corresponding to cases with one or more of the desired codes.
#' @export
#'
#' @examples
#' subsetToCodes(myPhenotypes, c('001.00', '002.00'), codes_to_invert = c('001.00'))
subsetToCodes <-
  function(data, desiredCodes, codes_to_invert = c()) {
    # are we going to invert any of these codes?
    inverting_codes <- length(codes_to_invert) > 0


    data[, c('IID', 'snp', desiredCodes)] %>%
      tidyr::gather(code, value,-IID,-snp) %>% {
        if (inverting_codes) {
          dplyr::left_join(.,
            tibble::tibble(code = codes_to_invert, invert = TRUE),
            by = 'code'
          )
        } else {
          dplyr::mutate(., invert = FALSE)
        }
      } %>% # Deal with inversion scenarios
      dplyr::mutate(
        value = as.numeric(value),
        #gets mad when value is an integer, so just in case make sure to force it to double.
        value = dplyr::case_when(
          value == 1 & invert ~ 0,
          value == 0 & invert ~ 1,
          is.na(value) ~ 0,
          # unknowns always are 'nos'
          TRUE ~ value
        )
      ) %>%
      dplyr::group_by(IID) %>%
      dplyr::mutate(total_codes = sum(value)) %>%
      dplyr::ungroup() %>%
      dplyr::filter(total_codes > 0) %>% # remove individuals with none of the requested codes
      dplyr::select(-total_codes,-invert) %>%
      tidyr::spread(code, value)
  }
