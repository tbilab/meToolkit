#' Extract SNP and Codes from URL query string
#'
#' Takes a bookmarked state in the form of a url query string, parses it, and
#' returns therequested snp and phecodes
#'
#' @param url_string string from a url with form `?snp_id__<code 1>_<code 2>` sans decimal.
#'
#' @return A list containing the requested SNP id and codes
#' @export
#'
#' @examples
#' extract_snp_codes_from_url("?rs123456__00800_90800_08300")
extract_snp_codes_from_url <- function(url_string){

  query_string <- url_string %>%
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
