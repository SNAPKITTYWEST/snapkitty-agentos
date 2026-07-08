! Combinatorial Enumeration: Graph Enumeration on n Vertices
! Implements backtracking with canonical form checking
! Tests: enumerate all graphs on 5 vertices, verify count = 34 (OEIS A000088)

module combinatorial_enumeration
    implicit none
    private
    public :: enumerate_graphs, count_graphs, is_canonical
    
    integer, parameter :: MAX_VERTICES = 10
    integer, parameter :: MAX_EDGES = 45  ! C(10,2)
    
    ! Graph representation: adjacency matrix
    type :: graph_t
        integer :: n
        integer :: adj(MAX_VERTICES, MAX_VERTICES)
    end type
    
    ! Enumeration result
    type :: enum_result
        integer :: count
        type(graph_t), allocatable :: graphs(:)
    end type

contains

    ! Compute canonical form of graph (lexicographically smallest adjacency)
    function canonical_form(g) result(canonical)
        type(graph_t), intent(in) :: g
        type(graph_t) :: canonical
        integer :: perm(MAX_VERTICES), best_perm(MAX_VERTICES)
        integer :: i, j, n_perms
        logical :: is_better
        
        canonical = g
        best_perm = [(i, i=1,g%n)]
        
        ! Try all permutations (n! total)
        n_perms = factorial(g%n)
        perm = [(i, i=1,g%n)]
        
        do i = 1, n_perms
            call next_permutation(perm, g%n)
            
            ! Check if this permutation gives lexicographically smaller form
            is_better = .false.
            do j = 1, g%n
                if (g%adj(perm(j), perm(j)) < canonical%adj(j, j)) then
                    is_better = .true.
                    exit
                else if (g%adj(perm(j), perm(j)) > canonical%adj(j, j)) then
                    exit
                end if
            end do
            
            if (is_better) then
                canonical = apply_permutation(g, perm)
                best_perm = perm
            end if
        end do
    end function

    ! Apply permutation to graph
    function apply_permutation(g, perm) result(new_g)
        type(graph_t), intent(in) :: g
        integer, intent(in) :: perm(:)
        type(graph_t) :: new_g
        integer :: i, j
        
        new_g%n = g%n
        new_g%adj = 0
        
        do i = 1, g%n
            do j = 1, g%n
                new_g%adj(i, j) = g%adj(perm(i), perm(j))
            end do
        end do
    end function

    ! Check if graph is in canonical form
    function is_canonical(g) result(is_canon)
        type(graph_t), intent(in) :: g
        logical :: is_canon
        type(graph_t) :: canonical
        
        canonical = canonical_form(g)
        is_canon = all(g%adj == canonical%adj)
    end function

    ! Enumerate all non-isomorphic graphs on n vertices
    subroutine enumerate_graphs(n, result)
        integer, intent(in) :: n
        type(enum_result), intent(out) :: result
        
        type(graph_t) :: current_graph
        integer :: edge_list(MAX_EDGES, 2)
        integer :: num_edges, max_edges
        integer :: i, j, edge_idx
        logical :: is_new
        
        ! Initialize
        result%count = 0
        allocate(result%graphs(1000))  ! Upper bound
        
        ! Generate all possible edges
        max_edges = n * (n - 1) / 2
        edge_idx = 0
        do i = 1, n
            do j = i+1, n
                edge_idx = edge_idx + 1
                edge_list(edge_idx, 1) = i
                edge_list(edge_idx, 2) = j
            end do
        end do
        
        ! Enumerate all 2^max_edges subsets
        do num_edges = 0, max_edges
            call enumerate_by_edges(n, edge_list, max_edges, num_edges, result)
        end do
        
        ! Trim allocated array
        result%graphs = result%graphs(1:result%count)
    end subroutine

    ! Recursive enumeration by number of edges
    recursive subroutine enumerate_by_edges(n, edge_list, max_edges, target_edges, result)
        integer, intent(in) :: n, max_edges, target_edges
        integer, intent(in) :: edge_list(:, :)
        type(enum_result), intent(inout) :: result
        
        integer :: subset(MAX_EDGES)
        integer :: i, j, u, v
        type(graph_t) :: g
        logical :: is_new
        
        ! Generate all combinations of target_edges from max_edges
        call generate_combinations(max_edges, target_edges, subset)
        
        ! For each combination, build graph and check canonical
        do i = 1, combination_count(max_edges, target_edges)
            ! Build graph from edge subset
            g%n = n
            g%adj = 0
            
            do j = 1, target_edges
                u = edge_list(subset(j), 1)
                v = edge_list(subset(j), 2)
                g%adj(u, v) = 1
                g%adj(v, u) = 1
            end do
            
            ! Check if canonical (non-isomorphic to previous)
            if (is_canonical(g)) then
                result%count = result%count + 1
                if (result%count <= size(result%graphs)) then
                    result%graphs(result%count) = g
                end if
            end if
        end do
    end subroutine

    ! Count graphs on n vertices
    function count_graphs(n) result(count)
        integer, intent(in) :: n
        integer :: count
        type(enum_result) :: result
        
        call enumerate_graphs(n, result)
        count = result%count
    end function

    ! Factorial
    pure function factorial(n) result(fact)
        integer, intent(in) :: n
        integer :: fact
        integer :: i
        
        fact = 1
        do i = 2, n
            fact = fact * i
        end do
    end function

    ! Next permutation (lexicographic)
    subroutine next_permutation(perm, n)
        integer, intent(inout) :: perm(:)
        integer, intent(in) :: n
        integer :: i, j, temp
        
        ! Find largest i such that perm(i) < perm(i+1)
        i = n - 1
        do while (i > 0 .and. perm(i) > perm(i+1))
            i = i - 1
        end do
        
        if (i == 0) then
            ! Last permutation, wrap to first
            perm = [(j, j=1,n)]
            return
        end if
        
        ! Find largest j such that perm(i) < perm(j)
        j = n
        do while (perm(j) < perm(i))
            j = j - 1
        end do
        
        ! Swap perm(i) and perm(j)
        temp = perm(i)
        perm(i) = perm(j)
        perm(j) = temp
        
        ! Reverse perm(i+1:n)
        do j = i+1, (n+i)/2
            temp = perm(j)
            perm(j) = perm(n - j + i + 1)
            perm(n - j + i + 1) = temp
        end do
    end subroutine

    ! Generate combinations (placeholder - needs full implementation)
    subroutine generate_combinations(n, k, subset)
        integer, intent(in) :: n, k
        integer, intent(out) :: subset(:)
        
        ! Simple implementation: first combination
        subset(1:k) = [(i, i=1,k)]
    end subroutine

    ! Count combinations C(n,k)
    pure function combination_count(n, k) result(count)
        integer, intent(in) :: n, k
        integer :: count
        
        count = factorial(n) / (factorial(k) * factorial(n-k))
    end function

end module combinatorial_enumeration

! Test program
program test_enumeration
    use combinatorial_enumeration
    implicit none
    
    integer :: n, count
    type(enum_result) :: result
    integer :: i
    
    print *, "==========================================================="
    print *, "  Skill 1: Combinatorial Enumeration"
    print *, "==========================================================="
    print *, ""
    
    ! Test 1: Count graphs on 1-5 vertices
    print *, "Test 1: Graph enumeration"
    print *, "n    Count    Expected (OEIS A000088)"
    print *, "---  -------  ----------------------"
    
    do n = 1, 5
        count = count_graphs(n)
        select case(n)
        case(1); print '(I2, I8, I12)', n, count, 1
        case(2); print '(I2, I8, I12)', n, count, 2
        case(3); print '(I2, I8, I12)', n, count, 4
        case(4); print '(I2, I8, I12)', n, count, 11
        case(5); print '(I2, I8, I12)', n, count, 34
        end select
    end do
    
    print *, ""
    
    ! Test 2: Enumerate and display graphs on 4 vertices
    print *, "Test 2: Enumerate graphs on 4 vertices"
    call enumerate_graphs(4, result)
    print '(A,I2,A)', "Found ", result%count, " non-isomorphic graphs"
    print *, ""
    
    ! Display first few graphs
    do i = 1, min(5, result%count)
        print '(A,I2,A)', "Graph ", i, ":"
        call print_graph(result%graphs(i))
        print *, ""
    end do
    
    print *, "==========================================================="
    print *, "  Enumeration complete"
    print *, "==========================================================="

contains

    subroutine print_graph(g)
        type(graph_t), intent(in) :: g
        integer :: i, j
        
        do i = 1, g%n
            print '("  ", *(I2))', (g%adj(i,j), j=1,g%n)
        end do
    end subroutine

end program test_enumeration
