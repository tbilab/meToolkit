#' Choose selected phecodes for app
#'    Takes a selection dataframe (or NULL) and our phewas table and returns the selected phewas codes from the table.
#' @param selection Selection dataframe (NULL will default to a given number of defaults)
#' @param phewas_table Phewas table dataframe
#' @param just_snps Boolean for if we're in a just snps mode which allows more codes to be seen at a time.
#' @param p_value_threshold Float between 0 and 1 for the threshold at which we exclude codes if our selection is too large.
#' @param max_num_phenos_all Integer of how max number of phenotypes function will select if including all cases (default = 15).
#' @param max_num_phenos_just_snps Integer of max number of phenotypes selected if app is only showing snp MA carriers (default = 150).
#'
#' @return filtered phewas table with either the selection exactly or the most significant snps based upon the \code{max_num_*} limits.
#' @export
#'
#' @examples
#' chooseSelectedCodes(NULL, myPhewas, just_snps = FALSE)
chooseSelectedCodes <- function(
  selection,
  phewas_table,
  just_snps,
  p_value_threshold = 0.001,
  max_num_phenos_all = 15,
  max_num_phenos_just_snps = 150
){

  number_phenos_limit <- ifelse(just_snps, max_num_phenos_just_snps, max_num_phenos_all)

  # There are three scenarios we have:
  # 1) no codes are selected at all
  #    - Just subset to a significance threshold for other plots
  noCodesSelected <- length(selection) == 0

  # 2) Subset of given codes is selected but is too large to reasonably show ~25 phenotypes
  #    - Take the 25 most significant codes of those selected.
  subsetTooLarge <- nrow(selection) > number_phenos_limit

  # 3) Subset is of reasonable size
  #    - Take those desired.
  if(noCodesSelected){
    new_codes <- phewas_table %>% dplyr::filter(p_val < p_value_threshold)

    if(nrow(new_codes) <= 1){
      new_codes <- phewas_table %>%
        dplyr::arrange(p_val) %>%
        head(5)
    }
  } else if(subsetTooLarge){
    new_codes <- phewas_table[selection$key,] %>%
      dplyr::arrange(p_val) %>%
      head(number_phenos_limit)
  } else {
    new_codes <- phewas_table[selection$key,]
  }
  new_codes
}
