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
#' infoPanel_UI('myInfoPanel', parentNS)
infoPanel_UI <- function(id, app_ns) {

  ns <- . %>% NS(id)() %>% app_ns()

  shiny::tagList(
    shiny::div(
      id = 'info_banner',
      shinydashboard::box(title = "",
          width = NULL,
          solidHeader=TRUE,
          r2d3::d3Output(ns("info_banner"), height = '150px')
      )
    )
  )
}

#' Server function of snp info panel
#'
#' @param input Auto-filled by callModule | ignore
#' @param output Auto-filled by callModule | ignore
#' @param session Auto-filled by callModule | ignore
#' @param snp_name String of the snp name
#' @param individual_data Individual level snp data dataframe with column \code{snp} containing copies of MA.
#' @param subset_maf Minor allele frequency of the current subset of cases.
#'
#' @return
#' @export
#'
#' @examples
#' callModule(info_panel, 'info_panel', snp_name, individual_data, subset_maf)
infoPanel <- function(input, output, session, snp_name, individual_data, subset_maf) {

  snp_info <- meToolkit::getSNPInfo(snp_name)
  snp_info$snp <- snp_name
  snp_info$maf_exome <- mean(individual_data$snp > 0)
  snp_info$maf_sel <- subset_maf

  output$info_banner <- r2d3::renderD3({
    r2d3::r2d3(
      snp_info,
      script = system.file("d3/infoPanel/infoPanel.js", package = "meToolkit"),
      css = system.file("d3/infoPanel/infoPanel.css", package = "meToolkit")
    )
  })
}
