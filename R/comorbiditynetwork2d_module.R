#' SNP information panel module
#'
#' @param id Unique id of module
#' @param app_ns A namespace function if this module is included within another module.
#'
#' @return
#' @export
#'
#' @examples
#'
#' comorbidityNetwork2d_UI('mycomorbidityNetwork2d', parentNS)
comorbidityNetwork2d_UI <- function(id, app_ns) {

  ns <- . %>% NS(id)() %>% app_ns()

  shiny::tagList(
    div(class = 'networkPlot',
        r2d3::d3Output(ns("networkPlot2d"), height = '100%')
    )
  )
}

#' Server function of snp info panel
#'
#' @param input Auto-filled by callModule | ignore
#' @param output Auto-filled by callModule | ignore
#' @param session Auto-filled by callModule | ignore
#' @return
#' @export
#'
#' @examples
#' callModule(info_panel, 'info_panel', snp_name, individual_data, subset_maf)
comorbidityNetwork2d <- function(
  input, output, session,
  subset_data,
  results_data,
  inverted_codes,
  snp_filter,
  parent_ns ) {

  ## Fill in by wiring up to the actions of the network and returning a list as described in notes.
  actionPayload <- NULL

  output$networkPlot2d <- r2d3::renderD3({
    network_data %>%
      jsonlite::toJSON() %>%
      r2d3::r2d3(
        # script = here('d3_plots/network_2d.js'),
        script = system.file("d3/comorbidityNetwork2d/comorbidityNetwork2d.js", package = "meToolkit"),
        container = 'div',
        dependencies = "d3-jetpack",
        options = list(
          just_snp = snp_filter,
          msg_loc = session$ns('message') # Probably broken
        )
      )
  })

  return(actionPayload)
}
