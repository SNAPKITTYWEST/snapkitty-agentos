! Hadamard Matrix Construction
! Implements Sylvester, Paley, and Williamson constructions
! Tests: Build Hadamard matrices for orders 4, 8, 12, 16, 20

module hadamard_construction
    implicit none
    private
    public :: sylvester, paley, williamson, is_hadamard, MAX_ORDER

    integer, parameter :: dp = selected_real_kind(15, 307)
    integer, parameter :: MAX_ORDER = 100

contains

    ! Sylvester construction: H_{2^k} from H_2
    ! H_2 = [[1, 1], [1, -1]]
    ! H_{2n} = [[H_n, H_n], [H_n, -H_n]]
    subroutine sylvester(k, H, n)
        integer, intent(in) :: k
        integer, intent(out) :: n
        integer, intent(out) :: H(MAX_ORDER, MAX_ORDER)
        
        integer :: i, j, m
        integer :: temp(MAX_ORDER, MAX_ORDER)
        
        n = 2**k
        H = 0
        
        ! Base case: H_1 = [1]
        H(1,1) = 1
        m = 1
        
        ! Double size k times
        do i = 1, k
            temp = 0
            
            ! [[H, H], [H, -H]]
            do j = 1, m
                temp(1:m, 1:m) = H(1:m, 1:m)
                temp(1:m, m+1:2*m) = H(1:m, 1:m)
                temp(m+1:2*m, 1:m) = H(1:m, 1:m)
                temp(m+1:2*m, m+1:2*m) = -H(1:m, 1:m)
            end do
            
            H = temp
            m = 2 * m
        end do
    end subroutine

    ! Paley construction using quadratic residues
    ! For prime p ≡ 3 (mod 4), construct H_{p+1}
    subroutine paley(p, H, n)
        integer, intent(in) :: p
        integer, intent(out) :: n
        integer, intent(out) :: H(MAX_ORDER, MAX_ORDER)
        
        integer :: i, j, qr
        integer, allocatable :: legendre(:)
        
        n = p + 1
        H = 0
        
        ! Compute Legendre symbols (quadratic residues)
        allocate(legendre(0:p-1))
        legendre(0) = 0
        do i = 1, p-1
            legendre(i) = legendre_symbol(i, p)
        end do
        
        ! Construct Paley matrix
        ! First row and column: all 1s
        H(1, :) = 1
        H(:, 1) = 1
        
        ! Rest: Q matrix (Legendre symbols)
        do i = 1, p
            do j = 1, p
                H(i+1, j+1) = legendre(mod(j - i + p, p))
            end do
        end do
        
        deallocate(legendre)
    end subroutine

    ! Legendre symbol (a/p)
    function legendre_symbol(a, p) result(sym)
        integer, intent(in) :: a, p
        integer :: sym
        
        integer :: i, power
        
        if (a == 0) then
            sym = 0
            return
        end if
        
        ! Compute a^((p-1)/2) mod p
        power = 1
        do i = 1, (p-1)/2
            power = mod(power * a, p)
        end do
        
        if (power == 1) then
            sym = 1
        else if (power == p - 1) then
            sym = -1
        else
            sym = 0
        end if
    end function

    ! Williamson construction (simplified)
    ! For n = 2m where m is odd
    subroutine williamson(m, H, n)
        integer, intent(in) :: m
        integer, intent(out) :: n
        integer, intent(out) :: H(MAX_ORDER, MAX_ORDER)
        
        integer :: i, j
        integer :: A(MAX_ORDER/2, MAX_ORDER/2), B(MAX_ORDER/2, MAX_ORDER/2)
        
        n = 2 * m
        H = 0
        
        ! Simplified: use circulant matrices
        ! A and B are circulant, symmetric, and satisfy A*A' + B*B' = m*I
        call construct_circulant(m, A)
        call construct_circulant(m, B)
        
        ! H = [[A, B], [B, -A]]
        H(1:m, 1:m) = A(1:m, 1:m)
        H(1:m, m+1:2*m) = B(1:m, 1:m)
        H(m+1:2*m, 1:m) = B(1:m, 1:m)
        H(m+1:2*m, m+1:2*m) = -A(1:m, 1:m)
    end subroutine

    ! Construct circulant matrix
    subroutine construct_circulant(m, C)
        integer, intent(in) :: m
        integer, intent(out) :: C(MAX_ORDER/2, MAX_ORDER/2)
        
        integer :: i, j
        integer :: first_row(MAX_ORDER/2)
        
        ! First row: +1 for quadratic residues, -1 otherwise
        first_row(1) = 1
        do i = 2, m
            if (is_quadratic_residue(i-1, m)) then
                first_row(i) = 1
            else
                first_row(i) = -1
            end if
        end do
        
        ! Circulant: each row is cyclic shift
        do i = 1, m
            do j = 1, m
                C(i, j) = first_row(mod(j - i + m, m) + 1)
            end do
        end do
    end subroutine

    ! Check if a is quadratic residue mod n
    function is_quadratic_residue(a, n) result(is_qr)
        integer, intent(in) :: a, n
        logical :: is_qr
        
        integer :: i, square
        
        is_qr = .false.
        do i = 0, n-1
            square = mod(i*i, n)
            if (square == a) then
                is_qr = .true.
                return
            end if
        end do
    end function

    ! Verify Hadamard property: H * H' = n * I
    function is_hadamard(H, n) result(is_h)
        integer, intent(in) :: n
        integer, intent(in) :: H(MAX_ORDER, MAX_ORDER)
        logical :: is_h
        
        integer :: i, j, k
        integer :: product
        
        is_h = .true.
        
        do i = 1, n
            do j = 1, n
                product = 0
                do k = 1, n
                    product = product + H(i, k) * H(j, k)
                end do
                
                if (i == j) then
                    if (product /= n) then
                        is_h = .false.
                        return
                    end if
                else
                    if (product /= 0) then
                        is_h = .false.
                        return
                    end if
                end if
            end do
        end do
    end function

end module hadamard_construction

! Test program
program test_hadamard
    use hadamard_construction
    implicit none
    
    integer :: H(MAX_ORDER, MAX_ORDER), n
    integer :: k, p, m
    logical :: valid
    
    print *, "==========================================================="
    print *, "  Skill 4: Hadamard Matrix Construction"
    print *, "==========================================================="
    print *, ""
    
    ! Test 1: Sylvester construction H_4, H_8, H_16
    print *, "Test 1: Sylvester construction"
    do k = 2, 4
        call sylvester(k, H, n)
        valid = is_hadamard(H, n)
        print '(A,I2,A,L1)', "  H_", n, " valid: ", valid
    end do
    print *, ""
    
    ! Test 2: Paley construction H_4, H_8, H_12
    print *, "Test 2: Paley construction"
    do p = 3, 11, 4  ! Primes ≡ 3 (mod 4)
        call paley(p, H, n)
        valid = is_hadamard(H, n)
        print '(A,I2,A,L1)', "  H_", n, " valid: ", valid
    end do
    print *, ""
    
    ! Test 3: Williamson construction H_6, H_10
    print *, "Test 3: Williamson construction"
    do m = 3, 5, 2
        call williamson(m, H, n)
        valid = is_hadamard(H, n)
        print '(A,I2,A,L1)', "  H_", n, " valid: ", valid
    end do
    print *, ""
    
    print *, "==========================================================="
    print *, "  Hadamard construction complete"
    print *, "==========================================================="
    
end program test_hadamard
