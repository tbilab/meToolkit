#' SNP info panel: UI
#'
#' @param id Unique id of module
#'
#' @return UI portion of info panel module
#' @export
#'
#' @examples
#'
#' info_panel_UI('myinfo_panel')
info_panel_UI <- function(id) {

  ns <- NS(id)

  shiny::tagList(
    r2d3::d3Output(ns("info_banner_metoolkit"), height = '100%')
  )
}

#' SNP info panel: Server
#'
#' @inheritParams main_dashboard
#' @param snp_name String of the snp name
#' @param all_individual_data Individual level data for all patients inc urrent
#'   cohort, needs to contain column \code{snp} containing copies of MA.
#' @param instructions HTML tags corresponding to static content to be displayed
#'   in bottom half of info panel.
#' @param colors A list of CSS-valid colors to paint interface in. Needs
#'   \code{light_grey, med_grey, dark_grey, light_blue}.
#' @param current_individual_data Reactive individual level data for the
#'   currently viewed subset of the cohort, again needs a \code{snp} column.
#'
#' @return Server component of info panel module
#' @export
#'
#' @examples
#' callModule(info_panel, 'info_panel', snp_name, all_individual_data, current_individual_data)
info_panel <- function(
  input, output, session,
  snp_name,
  all_individual_data,
  instructions,
  colors,
  current_individual_data ) {


  cohort_maf <- mean(all_individual_data$snp > 0)

  # Grab annotation info from internal table
  snp_info <- dplyr::filter(meToolkit::snp_annotations, rsid == snp_name | name == snp_name)

  if (nrow(snp_info) == 0) {
    # If we couldn't find anything for this snp just return null
    annotations <- NULL
  } else {
    annotations <- snp_info %>%
        tidyr::gather() %>%
        dplyr::filter(!is.na(value)) %>%
        dplyr::mutate(key = stringr::str_replace_all(key, '_', ' '))
  }

  output$info_banner_metoolkit <- r2d3::renderD3({

    snp_info <- list (
      snp = snp_name,
      maf_exome = cohort_maf,
      maf_sel =  mean(current_individual_data()$snp > 0), # grab maf of newest subset of cohort
      annotations = annotations
    )

    r2d3::r2d3(
      snp_info,
      options = list(colors = colors, instructions = as.character(instructions)),
      script = system.file("d3/info_panel/info_panel.js", package = "meToolkit"),
      container = 'div',
      dependencies = c(
        "d3-jetpack",
        system.file("d3/helpers.js", package = "meToolkit")
      ),
      css = c(
        system.file("d3/info_panel/info_panel.css", package = "meToolkit"),
        system.file("d3/helpers.css", package = "meToolkit"),
        system.file("css/common.css", package = "meToolkit")
      )
    )
  })
}
