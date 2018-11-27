#' Upset UI function
#'
#' @param id ID of shiny module. Needs to match the server-side call.
#' @param app_ns A namespace function if this module is included within another module.
#'
#' @return
#' @export
#'
#' @examples
#' upset_ui('upsetPlot', parentNS)
upset_UI <- function(id, app_ns = I, size_max = 250) {

  ns <- . %>% shiny::NS(id)() %>% app_ns()

  shiny::tagList(
    shinydashboardPlus::boxPlus(
      title = "Multimorbidity Patterns",
      width = NULL,
      id = 1,
      collapsible = TRUE,
      closable = FALSE,
      solidHeader=TRUE,
      enable_dropdown = TRUE,
      dropdown_icon = "wrench",
      dropdown_menu = shinydashboardPlus::dropdownItemList(
        shiny::sliderInput(ns("setSize"), "Min Size of Set:",
                    min = 0, max = size_max,
                    value = 20)
      ),
      shiny::div(id = 'upset2',
          r2d3::d3Output(ns('chart'), height = '100%')
      )
    )
  )
}

#' Upset Server Function
#'
#' @param input Auto-filled by callModule | ignore
#' @param output Auto-filled by callModule | ignore
#' @param session Auto-filled by callModule | ignore
#' @param codeData dataframe containing columns on \code{IID}, \code{snp}(# copies of allele), and columns for each code included.
#' @param snpData dataframe containing two columns \code{IID}, \code{snp} for every case in the population. Used in calculating a overall snp abundence.
#'
#' @return
#' @export
#'
#' @examples
#' callModule(meToolkit::upset, 'upsetPlotV2',
#' codeData = codeFiltered,
#' npData = snpData)
upset <- function(input, output, session, codeData, snpData) {

  # In order to get our general enrichment we will need all people in the dataset's snp data.
  snpAllCases <- snpData %>%
    dplyr::select(IID, copies = snp)

  rawData <- codeData %>%
    tidyr::gather(code, value, -IID, -snp) %>%
    dplyr::filter(value != 0)

  caseLevelPatterns <- rawData %>%
    dplyr::group_by(IID) %>%
    dplyr::summarise(
      pattern = paste(code, collapse = '-'),
      size = n(),
      snp = dplyr::last(snp)
    )


  testEnrichment <- function(currentPattern){
    caseLevelPatterns %>%
      dplyr::right_join(snpAllCases, by = 'IID') %>%
      dplyr::mutate(hasPattern = dplyr::case_when(
        pattern == currentPattern ~ 'yes',
        TRUE ~ 'no'
      )
      ) %>%
      dplyr::group_by(hasPattern) %>%
      dplyr::summarise(
        MaCarriers = sum(copies != 0),
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

  overallMaRate <- mean(snpAllCases$copies != 0)

  allSets <- caseLevelPatterns %>%
    dplyr::group_by(pattern) %>%
    dplyr::summarise(
      count = n(),
      size = dplyr::last(size),
      num_snp = sum(snp)
    )


  output$chart <- r2d3::renderD3({

    setData <- allSets %>%
      dplyr::filter(count > input$setSize) %>%
      dplyr::arrange(size, desc(count)) %>%
      dplyr::bind_cols(purrr::map_df(.$pattern, testEnrichment))

    codesLeft <- setData$pattern %>%
      paste(collapse = '-') %>%
      stringr::str_split('-') %>%
      `[[`(1) %>%
      unique()

    marginalData <- rawData %>%
      dplyr::filter(code %in% codesLeft) %>%
      dplyr::group_by(code) %>%
      dplyr::summarise(
        count = n(),
        num_snp = sum(snp)
      ) %>%
      jsonlite::toJSON()

    setData %>%
      r2d3::r2d3(
        script = system.file("d3/upset/upset.js", package = "meToolkit"),
        css = system.file("d3/upset/upset.css", package = "meToolkit"),
        dependencies = "d3-jetpack",
        options = list(marginalData = marginalData, overallMaRate = overallMaRate)
      )

  })
}
