#' Calculate risk ratio confidence interval
#' Calculates a risk ratio confidence interval given a pattern and snp count
#'
#' @param pattern_n Number of cases with pattern
#' @param pattern_snp Number of cases with pattern and SNP minor allele
#' @param other_n Number of cases without pattern
#' @param other_snp Number of cases without pattern and with SNP minor allele
#' @param CI_size Size of CI in proportion (default 0.95 = 95 percent interval)
#'
#' @return List with three entries: PE or RR point estimate, lower and upper for RR lower and upper bounds given interval size.
#' @export
#'
#' @examples
#' calcRrCi(pattern_n=120, pattern_snp=5, other_n=2000, other_snp=56, CI_size = 0.95 )
calcRrCi <- function(pattern_n, pattern_snp, other_n, other_snp, CI_size = 0.95){

  cont_table <- matrix(
    c(
                    pattern_snp,             other_snp,
      (pattern_n - pattern_snp), (other_n - other_snp)
    ),
    nrow = 2,
    byrow = TRUE
  )

  RR_estimates <- epitools::riskratio.small(cont_table, rev = "b", conf.level = CI_size)$measure[2,]

  list(
    PE = RR_estimates[1],
    lower = RR_estimates[2],
    upper = RR_estimates[3]
  )
}
