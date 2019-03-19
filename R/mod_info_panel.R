#' SNP information panel module
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
    r2d3::d3Output(ns("info_banner"), height = '150px')
  )
}

#' Server function of snp info panel
#'
#' @param input,output,session Auto-filled by callModule | ignore
#' @param snp_name String of the snp name
#' @param all_individual_data Individual level data for all patients inc urrent cohort, needs to contain column \code{snp} containing copies of MA.
#' @param current_individual_data Reactive individual level data for the currently viewed subset of the cohort, again needs a \code{snp} column.
#'
#' @return
#' @export
#'
#' @examples
#' callModule(info_panel, 'info_panel', snp_name, all_individual_data, current_individual_data)
info_panel <- function(
  input, output, session,
  snp_name,
  all_individual_data,
  current_individual_data ) {

  cohort_maf <- mean(all_individual_data$snp > 0)

  snp_info <- meToolkit::getSNPInfo(snp_name)
  snp_info$snp <- snp_name
  snp_info$maf_exome <- cohort_maf

  output$info_banner <- r2d3::renderD3({

    # grab maf of newest subset of cohort
    subset_maf <- mean(current_individual_data()$snp > 0)
    snp_info$maf_sel <- subset_maf

    r2d3::r2d3(
      snp_info,
      dependencies = "d3-jetpack",
      script = system.file("d3/info_panel/info_panel.js", package = "meToolkit")
    )
  })
}
