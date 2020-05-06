#' Upset plot of multimorbidity patterns: UI
#'
#'
#' @seealso \code{\link{upset}}
#' @param id String with unique id of module in app
#' @return HTML component of shiny module
#' @export
#'
#' @examples
#' upset_UI('my_mod')
upset_UI <- function(id) {
  ns <- NS(id)

  shiny::tagList(
    shiny::div(
      class = "title-bar",
      shiny::h3("Comorbidity Upset Plot", class = "template-section-title"),
      help_modal_UI(
        id = ns("upset"),
        title = "Help for the upset plot",
        help_img_url = "https://github.com/tbilab/meToolkit/raw/help_modals/inst/figures/upset_help_page.png",
        more_link = "https://prod.tbilab.org/phewas_me_manual/articles/meToolkit.html#comorbidity-upset-plot"
      )
    ),
    shiny::div(class = "template-section-body",
               r2d3::d3Output(ns('upset_plot'), height = '100%')),
  )
}

#' Upset plot of multimorbidity patterns: Server
#'
#' Generates an Upset plot to view patterns within comorbidity patterns.
#' Contains marginal charts on individual code counts, comorbidity counts, along
#' with relative risks of comorbidity patterns given one or more copies of minor
#' allele.
#'
#' @seealso \code{\link{upset_UI}}
#' @param input,output,session Auto-filled by callModule | ignore
#' @param individual_data Reactive object with dataframe containing columns on
#'   \code{IID}, \code{snp}(# copies of allele), and columns for each code
#'   included.
#' @param all_patient_snps dataframe containing two columns \code{IID},
#'   \code{snp} for every case in the population. Used in calculating a overall
#'   snp abundence.
#' @param results_data Dataframe containing the results of the phewas study.
#'   Needs columns \code{p_val}, \code{id}, \code{category}(along with
#'   accompanying \code{color}), \code{tooltip}. (Used to color codes.)
#' @param colors A list of CSS-valid colors to paint interface in. Needs
#'   \code{light_grey, med_grey, dark_grey, light_blue}.
#' @param action_object A \code{reactiveVal} that will be updated by the module
#'   upon isolation, deletion, or snp_filtering.
#' @return Shiny module
#' @export
#'
#' @examples
#' callModule(upset, 'my_mod')
upset <- function(input,
                  output,
                  session,
                  individual_data,
                  all_patient_snps,
                  results_data,
                  colors,
                  action_object = NULL) {
  message_path <- 'message_upset_plot'

  # What's the MA freq for all the data?
  overall_ma_freq <- mean(all_patient_snps$snp != 0)

  output$upset_plot <- r2d3::renderD3({
    # Turn wide individual data into a tidy list of phenotype presence
    tidy_phenotypes <- individual_data() %>%
      tidyr::gather(code, value, -IID, -snp) %>%
      dplyr::filter(value != 0)

    # Get the code to color mappings for each pair
    present_codes <- colnames(individual_data()) %>%
      {
        .[!(. %in% c('IID', 'snp'))]
      }
    code_to_color <- results_data %>%
      dplyr::filter(code %in% present_codes) %>% {
        this <- .
        color_map <- as.list(this$color)
        names(color_map) <- this$code
        color_map
      }

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
    testEnrichment <- function(currentPattern) {
      patient_to_pattern %>%
        dplyr::select(-snp) %>%
        dplyr::right_join(all_patient_snps, by = 'IID') %>%
        dplyr::mutate(hasPattern = dplyr::case_when(pattern == currentPattern ~ 'yes',
                                                    TRUE ~ 'no')) %>%
        dplyr::group_by(hasPattern) %>%
        dplyr::summarise(
          MaCarriers = sum(snp != 0),
          Total = n(),
          PropMa = MaCarriers / Total
        ) %>% {
          RR_results <-
            meToolkit::calc_pattern_risk_ratio(.$Total[2], .$MaCarriers[2], .$Total[1], .$MaCarriers[1])

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
      purrr::pluck(1) %>%
      unique()

    # Get summary of basic values after we filtered codes
    code_marginal_data <- tidy_phenotypes %>%
      dplyr::filter(code %in% codes_remaining) %>%
      dplyr::group_by(code) %>%
      dplyr::summarise(count = n(),  num_snp = sum(snp)) %>%
      dplyr::left_join(phecode_descriptions, by = c("code" = "phecode")) %>%
      jsonlite::toJSON()

    # Send everything to the upset javascript code
    r2d3::r2d3(
      data = pattern_to_enrichment,
      options = list(
        marginalData = code_marginal_data,
        overallMaRate = overall_ma_freq,
        code_to_color = code_to_color,
        min_set_size = 20,
        msg_loc = session$ns(message_path),
        colors = colors
      ),
      script = system.file("d3/upset/upset.js", package = "meToolkit"),
      css = c(
        system.file("d3/helpers.css", package = "meToolkit"),
        system.file("d3/upset/upset.css", package = "meToolkit"),
        system.file("css/common.css", package = "meToolkit")
      ),
      dependencies = c(
        "d3-jetpack",
        system.file("d3/helpers.js", package = "meToolkit"),
        system.file("d3/upset/helpers.js", package = "meToolkit")
      )
    )
  }) # End renderD3

  # Sets up response to help button
  shiny::callModule(help_modal, 'upset')

  if (!is.null(action_object)) {
    observeEvent(input[[message_path]], {
      validate(need(input[[message_path]], message = FALSE))
      action_object(input[[message_path]])
    })
  }
}
