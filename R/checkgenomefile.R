#' Checks genome input dataframe for correct form
#'
#' @param genome Tibble loaded from supplied file.
#' @param separate Return a list with snp name and data? Defaults to `TRUE`.
#'
#' @return A list of the genome data with the snp column renamed \code{snp} and
#'   the snp name saved as \code{snp_name}.
#' @export
#'
#' @examples
#' checkGenomeFile(uploadedGenomeData)
checkGenomeFile <- function(genome, separate = TRUE){

  columns <- colnames(genome)

  has_IID <- 'IID' %in% columns
  if(!has_IID) stop("Missing IID column.", call. = FALSE)

  two_columns <- length(columns) == 2
  if(!two_columns) stop("File needs to be just two columns.", call. = FALSE)

  # grab the name of the snp as the column name
  snp_name <- columns[columns != 'IID']

  # Make sure that the snp copies column is an integer or can be coerced to one.
  unique_counts <- genome[[snp_name]] %>% unique()
  if(!all(unique_counts %in% c(0,1,2))){
    stop("Your SNP copies column appears to have values other than 0,1,2.", call. = FALSE)
  }

  if(separate){
    # rename column containing snp to 'snp' for app
    colnames(genome)[columns == snp_name] <- 'snp'

    return(
      list(
        data = genome,
        snp_name = snp_name
      )
    )
  } else {
    return(genome)
  }

}
