! Probabilistic Method: Random Graph Generation and Monte Carlo
! Proves existence via probability
! Tests: Lower bounds on Ramsey numbers probabilistically

module probabilistic_method
    implicit none
    private
    public :: random_graph, monte_carlo_clique, estimate_ramsey_bound
    
    integer, parameter :: dp = selected_real_kind(15, 307)
    integer, parameter :: MAX_VERTICES = 100
    integer, parameter :: MAX_TRIALS = 10000
    
    ! Random number generator state
    integer, save :: seed = 12345

contains

    ! Generate random graph G(n, p)
    subroutine random_graph(n, p, adj)
        integer, intent(in) :: n
        real(dp), intent(in) :: p
        integer, intent(out) :: adj(MAX_VERTICES, MAX_VERTICES)
        
        integer :: i, j
        real(dp) :: r
        
        adj = 0
        
        do i = 1, n
            do j = i+1, n
                call random_number(r)
                if (r < p) then
                    adj(i, j) = 1
                    adj(j, i) = 1
                end if
            end do
        end do
    end subroutine

    ! Find maximum clique in graph (greedy approximation)
    function max_clique(n, adj) result(size)
        integer, intent(in) :: n
        integer, intent(in) :: adj(MAX_VERTICES, MAX_VERTICES)
        integer :: size
        
        integer :: i, j, clique(MAX_VERTICES), clique_size
        logical :: can_add
        
        ! Greedy: start with vertex 1, add vertices connected to all in clique
        clique(1) = 1
        clique_size = 1
        
        do i = 2, n
            can_add = .true.
            do j = 1, clique_size
                if (adj(i, clique(j)) == 0) then
                    can_add = .false.
                    exit
                end if
            end do
            
            if (can_add) then
                clique_size = clique_size + 1
                clique(clique_size) = i
            end if
        end do
        
        size = clique_size
    end function

    ! Monte Carlo estimation of maximum clique size
    subroutine monte_carlo_clique(n, p, trials, avg_clique, max_clique_size)
        integer, intent(in) :: n, trials
        real(dp), intent(in) :: p
        real(dp), intent(out) :: avg_clique
        integer, intent(out) :: max_clique_size
        
        integer :: adj(MAX_VERTICES, MAX_VERTICES)
        integer :: i, clique_size
        integer :: total_clique
        
        total_clique = 0
        max_clique_size = 0
        
        do i = 1, trials
            call random_graph(n, p, adj)
            clique_size = max_clique(n, adj)
            total_clique = total_clique + clique_size
            
            if (clique_size > max_clique_size) then
                max_clique_size = clique_size
            end if
        end do
        
        avg_clique = real(total_clique, dp) / real(trials, dp)
    end subroutine

    ! Estimate Ramsey number lower bound using probabilistic method
    ! R(k,k) > n if C(n,k) * 2^(1-C(k,2)) < 1
    subroutine estimate_ramsey_bound(k, n_lower_bound)
        integer, intent(in) :: k
        integer, intent(out) :: n_lower_bound
        
        integer :: n
        real(dp) :: prob
        
        n = k
        do
            ! Compute C(n,k) * 2^(1-C(k,2))
            prob = combination(n, k) * (2.0_dp ** (1 - combination(k, 2)))
            
            if (prob >= 1.0_dp) then
                exit
            end if
            
            n = n + 1
            
            if (n > 100) exit  ! Safety limit
        end do
        
        n_lower_bound = n
    end subroutine

    ! Compute binomial coefficient C(n,k)
    function combination(n, k) result(c)
        integer, intent(in) :: n, k
        real(dp) :: c
        
        integer :: i
        real(dp) :: num, den
        
        if (k > n .or. k < 0) then
            c = 0.0_dp
            return
        end if
        
        num = 1.0_dp
        den = 1.0_dp
        
        do i = 1, k
            num = num * real(n - i + 1, dp)
            den = den * real(i, dp)
        end do
        
        c = num / den
    end function

    ! Random number generator (simple LCG)
    subroutine random_number(r)
        real(dp), intent(out) :: r
        
        seed = mod(seed * 1103515245 + 12345, 2147483648)
        r = real(seed, dp) / 2147483648.0_dp
    end subroutine

end module probabilistic_method

! Test program
program test_probabilistic
    use probabilistic_method
    implicit none
    
    integer :: n, k, max_clique_size, n_lower
    real(dp) :: p, avg_clique
    
    print *, "==========================================================="
    print *, "  Skill 5: Probabilistic Method"
    print *, "==========================================================="
    print *, ""
    
    ! Test 1: Random graph generation
    print *, "Test 1: Random graph G(10, 0.5)"
    call monte_carlo_clique(10, 0.5_dp, 100, avg_clique, max_clique_size)
    print '(A,F6.3)', "  Average clique size: ", avg_clique
    print '(A,I0)', "  Maximum clique found: ", max_clique_size
    print *, ""
    
    ! Test 2: Larger random graph
    print *, "Test 2: Random graph G(20, 0.3)"
    call monte_carlo_clique(20, 0.3_dp, 100, avg_clique, max_clique_size)
    print '(A,F6.3)', "  Average clique size: ", avg_clique
    print '(A,I0)', "  Maximum clique found: ", max_clique_size
    print *, ""
    
    ! Test 3: Ramsey number lower bounds
    print *, "Test 3: Ramsey number lower bounds (probabilistic)"
    do k = 3, 6
        call estimate_ramsey_bound(k, n_lower)
        print '(A,I0,A,I0)', "  R(", k, ",", k, ") > ", n_lower
    end do
    print *, ""
    
    print *, "==========================================================="
    print *, "  Probabilistic method complete"
    print *, "==========================================================="
    
end program test_probabilistic
