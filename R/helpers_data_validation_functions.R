#' Checks genome input dataframe for correct form
#'
#' This function will lowercase all columns.
#'
#' @param genome Tibble loaded from supplied file.
#' @param separate Return a list with snp name and data? Defaults to `TRUE`.
#'
#' @return A list of the genome data with the snp column renamed \code{snp} and
#'   the snp name saved as \code{snp_name}.
#'
#' @examples
#' check_genome_file(uploadedGenomeData)
check_genome_file <- function(genome, separate = TRUE){

  # Make all columns lowercase.
  colnames(genome) <- tolower(colnames(genome))

  # Make sure ID column is in and in the format we want.
  genome <- detect_id_column(genome)

  two_columns <- length(colnames(genome)) == 2
  if(!two_columns) stop("File needs to be just two columns.", call. = FALSE)

  # grab the name of the snp as the column name
  snp_name <- colnames(genome)[colnames(genome) != 'id']

  # Make sure that the snp copies column is an integer or can be coerced to one.
  unique_counts <- genome[[snp_name]] %>% unique()
  if(!all(unique_counts %in% c(0,1,2))){
    stop("Your SNP copies column appears to have values other than 0,1,2.", call. = FALSE)
  }

  if(separate){
    # rename column containing snp to 'snp' for app
    colnames(genome)[colnames(genome) == snp_name] <- 'snp'

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

#' Check uploaded phenome file for correctness
#'
#' This function will lowercase all columns.
#'
#' @param phenome Uploaded dataframe containing phenotype info
#'
#' @return Dataframe if no errors are thrown.
#'
#' @examples
#' check_phenome_file(uploadedPhenomeFile)
check_phenome_file <- function(phenome){

  # should have two columns: one with title IID and one with title code.
  colnames(phenome) <-  tolower(colnames(phenome))

  # Make sure ID column is in and in the format we want.
  phenome <- detect_id_column(phenome)

  has_code <- 'code' %in% colnames(phenome)
  if(!has_code) stop("Missing Code column.", call. = FALSE)

  phenome
}


#' Check uploaded phewas file for correctness
#'
#' @param phewas Dataframe from uploaded phewas csv
#'
#' @return Supplied dataframe with a tooltip column added if it wasn't
#'   originally present.
#'
#' @examples
#' check_phewas_file('uploadedPhewasFile')
check_phewas_file <- function(phewas){

  required_columns <- c('code', 'p_val', 'OR', 'description', 'category')

  missing_columns <- required_columns[!(required_columns %in% colnames(phewas))]

  num_missing <- length(missing_columns)
  if (num_missing == 1) {
    stop(paste('Missing', missing_columns, 'column.'), call. = FALSE)
  } else if (num_missing > 1) {
    missing_columns[num_missing] <- paste('and',  missing_columns[num_missing])
    stop(paste0('Missing columns ', paste(missing_columns, collapse = ', '), '.'), call. = FALSE)
  }

  phewas
}

detect_id_column <- function(data, possible_id_cols = c('iid', 'id', 'grid'), final_id_name = 'id'){

  # Get boolean of columns that match id options
  is_id_col <- colnames(data) %in% possible_id_cols

  # Do any match columns?
  has_id_col <- any(is_id_col)

  if(!has_id_col){
    stop(
      paste(
        "Missing id column. Make sure your data has a column with one of the following names:",
        paste(possible_id_cols, collapse = ', ')
      ),
      call. = FALSE
    )
  }

  # Which column matches id?
  id_col_loc <- which(is_id_col)

  if(length(id_col_loc) > 1){
    stop(
      paste(
        "Multiple id columns in data. Make sure to only include",
        "one column with a name in the following list:",
        paste(possible_id_cols, collapse = ', ')
      ),
      call. = FALSE
    )
  }

  # Set the id column to standard value
  colnames(data)[id_col_loc] <- final_id_name

  data
}

