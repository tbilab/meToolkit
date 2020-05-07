#' Extract SNP and Codes from URL query string
#'
#' Reads a bookmarked state from an apps URL, parses it, and
#' returns the requested snp and phecodes. Uses \code{\link{extract_snp_codes_from_url_string}} to
#' parse the string.
#'
#' @param session session variable from current shiny server. Used to grab current URL string
#'
#' @return A list containing the requested SNP id and codes
#'
#' @examples
#' \dontrun{
#' extract_snp_codes_from_url(session)
#' }
extract_snp_codes_from_url <- function(session){
  shiny::isolate(session$clientData$url_search) %>%
    extract_snp_codes_from_url_string()
}

#' Extract SNP and Codes from raw URL query string
#'
#' Takes a bookmarked state in the form of a url query string, parses it, and
#' returns the requested snp and phecodes. Called by \code{\link{extract_snp_codes_from_url}}
#'
#' @param session session variable from current shiny server. Used to grab current URL string
#'
#' @return A list containing the requested SNP id and codes
#'
#' @examples
#' extract_snp_codes_from_url_string("?rs123456__00800_90800_08300")
extract_snp_codes_from_url_string <- function(query_string_raw){
  query_string <- query_string_raw %>%
    stringr::str_remove("\\?")

  snp_and_delim_pattern <- "rs.+__"

  snp_id <- query_string %>%
    stringr::str_extract(snp_and_delim_pattern) %>%
    stringr::str_remove("__")

  no_snp_found <- is.na(snp_id)

  codes <- query_string %>%
    stringr::str_remove(snp_and_delim_pattern) %>%
    stringr::str_split("_") %>%
    purrr::pluck(1) %>%
    stringr::str_replace("(.{3})(.*)", "\\1.\\2")

  # Need to have at least one code.
  no_codes_found <- length(codes) == 1 || codes[1] == ""

  list(
    snp =   if (no_snp_found)   NULL else snp_id,
    codes = if (no_codes_found) NULL else codes
  )
}

#' Embed snp id and selected codes in app URL
#'
#' @param snp Name of current snp
#' @param codes List of currently selected codes
#'
#' @return Nothing (updates app URL)
#'
#' @examples
#' embed_snp_codes_in_url('rs123456', c('009.00', '008.10', '008.20'))
embed_snp_codes_in_url <- function(snp, codes){

  # Collapse codes to decimal-less string
  codes_string <- codes %>%
    stringr::str_remove('\\.') %>%
    paste(collapse = '_')

  new_url_string <- glue::glue("?{snp}__{codes_string}")

  shiny::updateQueryString(new_url_string)
}
