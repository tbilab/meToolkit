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
#' @return Server component of info panel module
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

  # Grab location info from internal table
  loc_info <-  dplyr::filter(
      meToolkit:::all_exome_snps,
      snp == snp_name | rsid == snp_name
    )
  # If we couldn't get anything from internal data let user know
  if(nrow(loc_info) == 0){
    loc_info <- dplyr::tibble(
      chr = 'NA',
      gene = 'NA'
    )
  }

  output$info_banner <- r2d3::renderD3({

    snp_info = list(
      snp = snp_name,
      chromosome = loc_info$chr,
      gene = loc_info$gene,
      maf_exome = cohort_maf,
      maf_sel =  mean(current_individual_data()$snp > 0) # grab maf of newest subset of cohort
    )

    r2d3::r2d3(
      snp_info,
      script = system.file("d3/info_panel/version2.js", package = "meToolkit"),
      container = 'div',
      dependencies = c(
        "d3-jetpack",
        system.file("d3/helpers.js", package = "meToolkit")
      ),
      css = c(
        system.file("d3/info_panel/version2.css", package = "meToolkit"),
        system.file("d3/helpers.css", package = "meToolkit")
      )
    )
  })
}
