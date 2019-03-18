#' UI function of upset module
#'
#' @param id String with unique id of module in app
#' @param div_class A character string containing a class name for the entire plot to be wrapped in. This can then be used to style with external css. Defaults to 'upset_plot'.
#' @return HTML component of shiny module
#' @export
#'
#' @examples
#' upset_UI('my_mod')
upset_UI <- function(id, div_class = 'upset_plot') {
  ns <- NS(id)
  tagList(
    div(
      div(class = div_class,
        r2d3::d3Output(ns('chart'), height = '100%')
      )
    )
  )
}
#' Server function of upset module
#'
#' @param input,output,session Auto-filled by callModule | ignore
#' @param individual_data Reactive object with dataframe containing columns on \code{IID}, \code{snp}(# copies of allele), and columns for each code included.
#' @param all_patient_snps dataframe containing two columns \code{IID}, \code{snp} for every case in the population. Used in calculating a overall snp abundence.
#' @return Shiny module
#' @export
#'
#' @examples
#' callModule(upset, 'my_mod')
upset <- function(input, output, session, individual_data, all_patient_snps) {

  # What's the MA freq for all the data?
  overall_ma_freq <- mean(all_patient_snps$snp != 0)

  output$chart <- r2d3::renderD3({

    # Turn wide individual data into a tidy list of phenotype presence
    tidy_phenotypes <- individual_data() %>%
      tidyr::gather(code, value, -IID, -snp) %>%
      dplyr::filter(value != 0)

    # Turn the tidy phenotypes into a dataframe of patient id for each row along with their pattern of phenotypes
    patient_to_pattern <- tidy_phenotypes %>%
      dplyr::group_by(IID) %>%
      dplyr::summarise(
        pattern = paste(code, collapse = '-'),
        size = n(),
        snp = dplyr::last(snp)
      )

    # Reduce the patient to pattern dataframe into a summary of unique patterns
    unique_patterns <- patient_to_pattern %>%
      dplyr::group_by(pattern) %>%
      dplyr::summarise(
        count = n(),
        size = dplyr::last(size),
        num_snp = sum(snp)
      )

    # Function that returns enrichment info for a given pattern
    testEnrichment <- function(currentPattern){

      patient_to_pattern %>%
        select(-snp) %>%
        dplyr::right_join(all_patient_snps, by = 'IID') %>%
        dplyr::mutate(
          hasPattern = dplyr::case_when(
            pattern == currentPattern ~ 'yes',
            TRUE ~ 'no'
          )
        ) %>%
        dplyr::group_by(hasPattern) %>%
        dplyr::summarise(
          MaCarriers = sum(snp != 0),
          Total = n(),
          PropMa = MaCarriers/Total
        ) %>% {

          RR_results <- meToolkit::calcRrCi(.$Total[2], .$MaCarriers[2], .$Total[1], .$MaCarriers[1])

          tibble::tibble(
            pointEst = RR_results$PE,
            lower = RR_results$lower,
            upper = RR_results$upper
          )
        }
    }

    # Calculate enrichment on each unique pattern
    pattern_to_enrichment <- unique_patterns %>%
      dplyr::arrange(size, desc(count)) %>%
      dplyr::bind_cols(purrr::map_df(.$pattern, testEnrichment))

    # After this filtering what codes do we still have?
    codes_remaining <- pattern_to_enrichment$pattern %>%
      paste(collapse = '-') %>%
      stringr::str_split('-') %>%
      `[[`(1) %>%
      unique()

    # Get summary of basic values after we filtered codes
    code_marginal_data <- tidy_phenotypes %>%
      dplyr::filter(code %in% codes_remaining) %>%
      dplyr::group_by(code) %>%
      dplyr::summarise(
        count = n(),
        num_snp = sum(snp)
      ) %>%
      jsonlite::toJSON()


    # Send everything to the upset javascript code
    r2d3::r2d3(
      data = pattern_to_enrichment,
      options = list(marginalData = code_marginal_data, overallMaRate = overall_ma_freq, min_set_size = 20),
      script = system.file("d3/upset/upset.js", package = "meToolkit"),
      css = system.file("d3/upset/upset.css", package = "meToolkit"),
      dependencies = c("d3-jetpack",system.file("d3/upset/helpers.js", package = "meToolkit"))
    )
  }) # End renderD3
}
