! Graph Isomorphism Detection using Canonical Labeling
! Implements simplified nauty algorithm
! Tests: detect isomorphic graphs, verify against known results

module graph_isomorphism
    implicit none
    private
    public :: graph_t, are_isomorphic, canonical_label, graph_hash
    
    integer, parameter :: MAX_VERTICES = 20
    
    type :: graph_t
        integer :: n
        integer :: adj(MAX_VERTICES, MAX_VERTICES)
    end type

contains

    ! Compute canonical label for graph (simplified nauty)
    function canonical_label(g) result(label)
        type(graph_t), intent(in) :: g
        integer :: label(MAX_VERTICES)
        integer :: degree(MAX_VERTICES)
        integer :: i, j, max_deg, best_vertex
        logical :: used(MAX_VERTICES)
        
        ! Initialize with degree-based ordering
        do i = 1, g%n
            degree(i) = sum(g%adj(i, 1:g%n))
        end do
        
        ! Greedy canonical labeling
        label = 0
        used = .false.
        
        ! Start with highest degree vertex
        max_deg = -1
        best_vertex = 1
        do i = 1, g%n
            if (degree(i) > max_deg) then
                max_deg = degree(i)
                best_vertex = i
            end if
        end do
        
        label(best_vertex) = 1
        used(best_vertex) = .true.
        
        ! Iteratively add neighbors
        do i = 2, g%n
            call add_next_vertex(g, label, used, degree, i)
        end do
    end function

    ! Add next vertex to labeling
    subroutine add_next_vertex(g, label, used, degree, position)
        type(graph_t), intent(in) :: g
        integer, intent(inout) :: label(:)
        logical, intent(inout) :: used(:)
        integer, intent(in) :: degree(:)
        integer, intent(in) :: position
        
        integer :: i, j, best_vertex, best_score
        integer :: neighbor_score
        
        best_vertex = -1
        best_score = -1
        
        ! Find vertex with most connections to already-labeled vertices
        do i = 1, g%n
            if (.not. used(i)) then
                neighbor_score = 0
                do j = 1, g%n
                    if (used(j) .and. g%adj(i, j) == 1) then
                        neighbor_score = neighbor_score + 1
                    end if
                end do
                
                ! Score: neighbor connections * 1000 + degree
                if (neighbor_score * 1000 + degree(i) > best_score) then
                    best_score = neighbor_score * 1000 + degree(i)
                    best_vertex = i
                end if
            end if
        end do
        
        if (best_vertex > 0) then
            label(best_vertex) = position
            used(best_vertex) = .true.
        end if
    end subroutine

    ! Apply canonical label to get canonical form
    function apply_canonical(g) result(canonical)
        type(graph_t), intent(in) :: g
        type(graph_t) :: canonical
        integer :: label(MAX_VERTICES)
        integer :: i, j
        
        label = canonical_label(g)
        canonical%n = g%n
        canonical%adj = 0
        
        do i = 1, g%n
            do j = 1, g%n
                if (g%adj(i, j) == 1) then
                    canonical%adj(label(i), label(j)) = 1
                end if
            end do
        end do
    end function

    ! Check if two graphs are isomorphic
    function are_isomorphic(g1, g2) result(is_iso)
        type(graph_t), intent(in) :: g1, g2
        logical :: is_iso
        type(graph_t) :: canon1, canon2
        
        if (g1%n /= g2%n) then
            is_iso = .false.
            return
        end if
        
        ! Compare canonical forms
        canon1 = apply_canonical(g1)
        canon2 = apply_canonical(g2)
        
        is_iso = all(canon1%adj(1:g1%n, 1:g1%n) == canon2%adj(1:g2%n, 1:g2%n))
    end function

    ! Compute hash of canonical form (for quick comparison)
    function graph_hash(g) result(hash)
        type(graph_t), intent(in) :: g
        integer :: hash
        type(graph_t) :: canonical
        integer :: i, j
        
        canonical = apply_canonical(g)
        hash = 0
        
        do i = 1, g%n
            do j = 1, g%n
                hash = hash + canonical%adj(i, j) * (i * 100 + j)
            end do
        end do
    end function

end module graph_isomorphism

! Test program
program test_isomorphism
    use graph_isomorphism
    implicit none
    
    type(graph_t) :: g1, g2, g3
    logical :: iso
    
    print *, "==========================================================="
    print *, "  Skill 2: Graph Isomorphism Detection"
    print *, "==========================================================="
    print *, ""
    
    ! Test 1: Two identical graphs
    print *, "Test 1: Identical graphs"
    g1%n = 4
    g1%adj = 0
    g1%adj(1,2) = 1; g1%adj(2,1) = 1
    g1%adj(2,3) = 1; g1%adj(3,2) = 1
    g1%adj(3,4) = 1; g1%adj(4,3) = 1
    
    g2 = g1
    
    iso = are_isomorphic(g1, g2)
    print '(A,L1)', "  Isomorphic: ", iso
    print '(A,I0)', "  Hash g1: ", graph_hash(g1)
    print '(A,I0)', "  Hash g2: ", graph_hash(g2)
    print *, ""
    
    ! Test 2: Isomorphic graphs (different labeling)
    print *, "Test 2: Isomorphic graphs (relabeled)"
    g3%n = 4
    g3%adj = 0
    g3%adj(2,4) = 1; g3%adj(4,2) = 1
    g3%adj(4,1) = 1; g3%adj(1,4) = 1
    g3%adj(1,3) = 1; g3%adj(3,1) = 1
    
    iso = are_isomorphic(g1, g3)
    print '(A,L1)', "  Isomorphic: ", iso
    print '(A,I0)', "  Hash g3: ", graph_hash(g3)
    print *, ""
    
    ! Test 3: Non-isomorphic graphs
    print *, "Test 3: Non-isomorphic graphs"
    g2%adj(1,4) = 1; g2%adj(4,1) = 1  ! Add edge to make it different
    
    iso = are_isomorphic(g1, g2)
    print '(A,L1)', "  Isomorphic: ", iso
    print *, ""
    
    print *, "==========================================================="
    print *, "  Isomorphism detection complete"
    print *, "==========================================================="
    
end program test_isomorphism
